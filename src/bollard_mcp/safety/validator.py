from __future__ import annotations

"""
SQL Safety Pipeline — Validator

Parses SQL AST via sqlglot and enforces:
- Destructive operation blocking
- WHERE clause requirements on UPDATE/DELETE
- Forbidden table access control
- Blocked DDL operation enforcement per permission mode
- Dynamic risk scoring (LOW → EXTREME)
"""

from dataclasses import dataclass, field
from enum import IntEnum
from typing import Literal

import sqlglot
import sqlglot.expressions as exp


# ── Dangerous operations always blocked in non-admin mode ─────────────────
_HARD_BLOCKED: set[str] = {
    "DROP TABLE",
    "DROP DATABASE",
    "DROP SCHEMA",
    "TRUNCATE",
    "DROP INDEX",
    "DROP VIEW",
    "DROP FUNCTION",
    "DROP PROCEDURE",
}

# ── Soft-delete / status column heuristics for intent validation ──────────
SOFT_DELETE_COLUMNS = {"is_deleted", "deleted_at", "archived", "archived_at", "removed_at", "is_active"}
STATUS_COLUMNS = {"status", "subscription_status", "state", "user_state", "account_status"}
TENANT_COLUMNS = {"org_id", "organization_id", "tenant_id", "company_id", "workspace_id", "account_id"}


def to_sqlglot_dialect(dialect: str) -> str:
    """Map database adapter dialect name to sqlglot's expected name."""
    d = (dialect or "").lower()
    if d in ("postgresql", "postgres"):
        return "postgres"
    if d in ("mssql", "sqlserver"):
        return "tsql"
    if d == "mariadb":
        return "mysql"
    return d


# ── Risk Level ────────────────────────────────────────────────────────────

class RiskLevel(IntEnum):
    """
    Tiered risk classification for SQL operations.

    LOW      → SELECT — auto-execute.
    MEDIUM   → Write affecting < 5 rows — OS PIN required.
    HIGH     → Write affecting >= 5 rows — OS PIN + typed confirmation phrase.
    CRITICAL → Schema DDL (ALTER TABLE) — OS PIN + suggested reversal shown.
    EXTREME  → Destructive DDL (DROP / TRUNCATE) — admin mode only.
    """
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4
    EXTREME = 5


# Threshold: writes affecting >= this many rows escalate to HIGH risk
_BULK_WRITE_THRESHOLD = 5


def score_risk(
    sql: str,
    dialect: str = "postgres",
    estimated_rows: int | None = None,
) -> RiskLevel:
    """
    Classify the risk level of a SQL statement.

    Classification order (highest-specificity first):
    1. EXTREME  — DROP TABLE, TRUNCATE
    2. CRITICAL — ALTER TABLE (schema DDL)
    3. LOW      — SELECT
    4. HIGH     — write affecting >= 5 rows (estimated_rows from EXPLAIN)
    5. MEDIUM   — write affecting < 5 rows

    Args:
        sql:            The SQL statement to score.
        dialect:        Database dialect for AST parsing.
        estimated_rows: Row count estimate from EXPLAIN (None = unknown).

    Returns:
        RiskLevel enum value.
    """
    dialect = to_sqlglot_dialect(dialect)
    operation = detect_operation(sql)
    upper = sql.strip().upper()

    # EXTREME — hard-blocked destructive DDL
    for blocked_op in _HARD_BLOCKED:
        if blocked_op in upper:
            return RiskLevel.EXTREME

    # CRITICAL — schema changes
    if operation == "ALTER" or "ALTER TABLE" in upper:
        return RiskLevel.CRITICAL

    # LOW — pure reads
    if operation in ("SELECT", "EXPLAIN"):
        return RiskLevel.LOW

    # Writes — grade by estimated row impact
    if operation in ("INSERT", "UPDATE", "DELETE", "CREATE"):
        if estimated_rows is not None and estimated_rows >= _BULK_WRITE_THRESHOLD:
            return RiskLevel.HIGH
        return RiskLevel.MEDIUM

    # Fallback — treat unknown ops as HIGH
    return RiskLevel.HIGH


def generate_suggested_reversal(sql: str, dialect: str = "postgres") -> str | None:
    """
    For CRITICAL DDL, generate a best-effort inverse DDL statement.

    ⚠️ This is a SUGGESTED REVERSAL, not a true rollback.
    It will recreate the schema structure but CANNOT restore lost data.
    Only covers simple, mechanically reversible DDL.

    Returns None if the operation is too complex to safely reverse.
    """
    dialect = to_sqlglot_dialect(dialect)
    upper = sql.strip().upper()

    try:
        parsed = sqlglot.parse_one(sql, dialect=dialect)
    except Exception:
        return None

    # ALTER TABLE ... ADD COLUMN → DROP COLUMN
    if "ADD COLUMN" in upper or "ADD " in upper:
        try:
            for alter in parsed.find_all(exp.AlterTable):
                table = alter.this.name if alter.this else "<table>"
                for action in alter.find_all(exp.AddConstraint):
                    col = action.this
                    if isinstance(col, exp.ColumnDef):
                        col_name = col.this.name if col.this else "<column>"
                        return (
                            f"-- Suggested Reversal (schema only, no data restored):\n"
                            f"ALTER TABLE {table} DROP COLUMN {col_name};"
                        )
        except Exception:
            pass

    # ALTER TABLE ... DROP COLUMN → ADD COLUMN (type unknown = TEXT fallback)
    if "DROP COLUMN" in upper:
        try:
            for alter in parsed.find_all(exp.AlterTable):
                table = alter.this.name if alter.this else "<table>"
                for action in alter.find_all(exp.Drop):
                    col_name = action.this.name if action.this else "<column>"
                    return (
                        f"-- Suggested Reversal (schema only, original data is LOST):\n"
                        f"-- ⚠️  The column will be recreated empty. Lost data cannot be recovered without a backup.\n"
                        f"ALTER TABLE {table} ADD COLUMN {col_name} TEXT;"
                    )
        except Exception:
            pass

    # ALTER TABLE ... RENAME TO
    if "RENAME TO" in upper:
        try:
            for alter in parsed.find_all(exp.AlterTable):
                old_name = alter.this.name if alter.this else "<original_table>"
                for action in alter.find_all(exp.RenameTable):
                    new_name = action.this.name if action.this else "<new_name>"
                    return (
                        f"-- Suggested Reversal:\n"
                        f"ALTER TABLE {new_name} RENAME TO {old_name};"
                    )
        except Exception:
            pass

    return None


@dataclass
class ValidationResult:
    is_allowed: bool
    operation_type: str                     # SELECT / INSERT / UPDATE / DELETE / CREATE / DROP / etc.
    tables_accessed: list[str]
    blocked_reason: str | None = None
    warnings: list[str] = field(default_factory=list)
    safe_alternative: str | None = None     # Suggested fix when blocked


@dataclass
class IntentAnalysis:
    interpreted_intent: str
    assumed_filters: list[str]
    ambiguity_warnings: list[str]
    confidence: Literal["HIGH", "MEDIUM", "LOW"]


def detect_operation(sql: str) -> str:
    """Return the primary operation type from a SQL statement."""
    stripped = sql.strip().upper()
    for op in ("SELECT", "INSERT", "UPDATE", "DELETE", "CREATE", "DROP", "TRUNCATE", "ALTER", "EXPLAIN"):
        if stripped.startswith(op):
            return op
    return "UNKNOWN"


def extract_tables(sql: str, dialect: str = "postgres") -> list[str]:
    """Extract all table names referenced in the SQL statement."""
    dialect = to_sqlglot_dialect(dialect)
    try:
        parsed = sqlglot.parse_one(sql, dialect=dialect)
        tables = set()
        for node in parsed.walk():
            if isinstance(node, exp.Table):
                name = node.name
                if name and name.lower() not in ("dual",):
                    tables.add(name.lower())
        return sorted(tables)
    except Exception:
        return []


def has_where_clause(sql: str, dialect: str = "postgres") -> bool:
    """Check if a UPDATE/DELETE statement has a WHERE clause."""
    dialect = to_sqlglot_dialect(dialect)
    try:
        parsed = sqlglot.parse_one(sql, dialect=dialect)
        return parsed.find(exp.Where) is not None
    except Exception:
        # Conservative: if parsing fails, assume no WHERE
        return False


def is_table_forbidden(table: str, forbidden_tables: list[str]) -> bool:
    """Check if a table matches any of the forbidden table patterns."""
    t_lower = table.lower()
    for forbidden in forbidden_tables:
        f_lower = forbidden.lower()
        if f_lower.startswith("*."):
            suffix = f_lower[2:]
            if t_lower.endswith(suffix):
                return True
        elif f_lower.endswith(".*"):
            prefix = f_lower[:-2]
            if t_lower.startswith(prefix):
                return True
        elif t_lower == f_lower:
            return True
    return False


def validate_query(
    sql: str,
    mode: Literal["read_only", "read_write", "admin"],
    forbidden_tables: list[str],
    dialect: str = "postgres",
) -> ValidationResult:
    """
    Run the safety validation pipeline on a SQL statement.

    Returns a ValidationResult with is_allowed, operation_type,
    tables accessed, and any blocking reason.
    """
    dialect = to_sqlglot_dialect(dialect)
    operation = detect_operation(sql)
    tables = extract_tables(sql, dialect)

    # ── Hard block — always rejected outside admin mode ───────────────
    upper = sql.strip().upper()
    for blocked_op in _HARD_BLOCKED:
        if blocked_op in upper and mode != "admin":
            return ValidationResult(
                is_allowed=False,
                operation_type=operation,
                tables_accessed=tables,
                blocked_reason=(
                    f"Operation `{blocked_op}` is blocked. "
                    f"Only `admin` mode connections may use this operation. "
                    f"If this is intentional, reconnect with mode='admin'."
                ),
            )

    # ── Read-only enforcement ─────────────────────────────────────────
    if mode == "read_only" and operation in ("INSERT", "UPDATE", "DELETE", "CREATE", "ALTER", "DROP"):
        return ValidationResult(
            is_allowed=False,
            operation_type=operation,
            tables_accessed=tables,
            blocked_reason=(
                f"Operation `{operation}` is not allowed in read_only mode. "
                f"Reconnect with mode='read_write' to enable writes."
            ),
        )

    # ── UPDATE / DELETE must have WHERE ──────────────────────────────
    if operation in ("UPDATE", "DELETE") and not has_where_clause(sql, dialect):
        return ValidationResult(
            is_allowed=False,
            operation_type=operation,
            tables_accessed=tables,
            blocked_reason=(
                f"`{operation}` without a WHERE clause would affect ALL rows. "
                f"Add a WHERE clause, or use mode='admin' with confirmed=True to override."
            ),
            safe_alternative=f"-- Add a WHERE clause to limit scope:\n{sql.rstrip(';')}\nWHERE <condition>;",
        )

    # ── Forbidden table access ────────────────────────────────────────
    for table in tables:
        if is_table_forbidden(table, forbidden_tables):
            return ValidationResult(
                is_allowed=False,
                operation_type=operation,
                tables_accessed=tables,
                blocked_reason=f"Access to table `{table}` is forbidden by connection policy.",
            )

    return ValidationResult(
        is_allowed=True,
        operation_type=operation,
        tables_accessed=tables,
    )


def inject_limit(sql: str, max_rows: int, dialect: str = "postgres") -> str:
    """
    Inject a LIMIT clause into a SELECT query if one is not already present.
    Returns the (possibly modified) SQL.
    """
    dialect = to_sqlglot_dialect(dialect)
    if detect_operation(sql) != "SELECT":
        return sql
    try:
        parsed = sqlglot.parse_one(sql, dialect=dialect)
        if parsed.find(exp.Limit):
            return sql  # Already has LIMIT
        # Add LIMIT using sqlglot AST limit helper
        if hasattr(parsed, "limit"):
            return parsed.limit(max_rows).sql(dialect=dialect)
        
        # Fallback for other node types
        stripped = sql.rstrip(";").rstrip()
        return f"{stripped}\nLIMIT {max_rows};"
    except Exception:
        # Fallback: append raw LIMIT
        stripped = sql.rstrip(";").rstrip()
        return f"{stripped}\nLIMIT {max_rows};"
