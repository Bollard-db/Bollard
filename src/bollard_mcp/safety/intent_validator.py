from __future__ import annotations

"""
Semantic Intent Validator

Detects mismatches between what the user likely intended
and what the SQL actually does — using pure static analysis,
no LLM required.

Examples of issues detected:
- Soft-delete blind spots (is_deleted column not in WHERE)
- Status column ambiguity ("active users" but no status filter)
- Multi-tenant scope missing (org_id/tenant_id table without filter)
- Absolute date vs relative date
- Ambiguous column names across joined tables
"""

from dataclasses import dataclass, field
from typing import Literal

import sqlglot
import sqlglot.expressions as exp

from .validator import (
    SOFT_DELETE_COLUMNS,
    STATUS_COLUMNS,
    TENANT_COLUMNS,
    detect_operation,
    extract_tables,
    to_sqlglot_dialect,
)
from ..adapters.base import SchemaSnapshot, TableInfo


@dataclass
class IntentAnalysis:
    interpreted_intent: str
    assumed_filters: list[str]
    ambiguity_warnings: list[str]
    confidence: Literal["HIGH", "MEDIUM", "LOW"]


def _get_where_columns(sql: str, dialect: str = "postgres") -> set[str]:
    """Extract column names used in the WHERE clause."""
    dialect = to_sqlglot_dialect(dialect)
    try:
        parsed = sqlglot.parse_one(sql, dialect=dialect)
        where = parsed.find(exp.Where)
        if not where:
            return set()
        cols = set()
        for col in where.walk():
            if isinstance(col, exp.Column):
                cols.add(col.name.lower())
        return cols
    except Exception:
        return set()


def _get_select_columns(sql: str, dialect: str = "postgres") -> list[str]:
    """Extract column names from SELECT clause."""
    dialect = to_sqlglot_dialect(dialect)
    try:
        parsed = sqlglot.parse_one(sql, dialect=dialect)
        cols = []
        select = parsed.find(exp.Select)
        if select:
            for expr in select.expressions:
                if isinstance(expr, exp.Column):
                    cols.append(expr.name.lower())
                elif isinstance(expr, exp.Alias):
                    cols.append(expr.alias.lower())
        return cols
    except Exception:
        return []


def _get_table_columns_by_name(
    table_name: str,
    schema: SchemaSnapshot,
) -> set[str]:
    """Look up column names for a table in the schema snapshot."""
    for t in schema.tables:
        if t.name.lower() == table_name.lower():
            return {c.name.lower() for c in t.columns}
    return set()


def _find_table_info(table_name: str, schema: SchemaSnapshot) -> TableInfo | None:
    for t in schema.tables:
        if t.name.lower() == table_name.lower():
            return t
    return None


def _describe_select(sql: str) -> str:
    """Build a human-readable summary of what a SELECT does."""
    try:
        parsed = sqlglot.parse_one(sql, dialect="postgres")
        parts = []

        # Tables
        tables = extract_tables(sql)
        if tables:
            parts.append(f"Reads from: {', '.join(tables)}")

        # Aggregations
        if parsed.find(exp.Count):
            parts.append("counts rows")
        if parsed.find(exp.Sum):
            parts.append("sums values")
        if parsed.find(exp.Avg):
            parts.append("averages values")

        # Filtering
        where = parsed.find(exp.Where)
        if where:
            parts.append(f"filtered by: {where.sql()[:100]}")

        # Sorting
        order = parsed.find(exp.Order)
        if order:
            parts.append(f"ordered by: {order.sql()}")

        # Limit
        limit = parsed.find(exp.Limit)
        if limit:
            parts.append(f"limited to {limit.this.sql()} rows")

        return " | ".join(parts) if parts else "SELECT query"
    except Exception:
        return "SELECT query"


def analyze_intent(
    sql: str,
    schema: SchemaSnapshot,
    dialect: str = "postgres",
) -> IntentAnalysis:
    """
    Perform semantic intent analysis on a SQL statement.

    Cross-references the SQL AST against the known schema to detect
    potential mismatches between intended and actual query behavior.
    All checks are pure static analysis — no LLM involved.
    """
    dialect = to_sqlglot_dialect(dialect)
    operation = detect_operation(sql)
    warnings: list[str] = []
    assumed_filters: list[str] = []
    confidence: Literal["HIGH", "MEDIUM", "LOW"] = "HIGH"

    tables_in_query = extract_tables(sql, dialect)
    where_cols = _get_where_columns(sql, dialect)

    for table_name in tables_in_query:
        table_info = _find_table_info(table_name, schema)
        if not table_info:
            continue

        schema_cols = {c.name.lower() for c in table_info.columns}

        # ── Soft-delete blind spot ──────────────────────────────────
        soft_delete_present = schema_cols & SOFT_DELETE_COLUMNS
        soft_delete_filtered = where_cols & SOFT_DELETE_COLUMNS
        if soft_delete_present and not soft_delete_filtered:
            present_col = next(iter(soft_delete_present))
            warnings.append(
                f"Column `{present_col}` exists on `{table_name}` but is not in the WHERE clause — "
                f"results may include soft-deleted records."
            )
            confidence = "MEDIUM"

        # ── Status column ambiguity ─────────────────────────────────
        status_cols_present = schema_cols & STATUS_COLUMNS
        status_cols_filtered = where_cols & STATUS_COLUMNS
        if status_cols_present and not status_cols_filtered:
            present_col = next(iter(status_cols_present))
            warnings.append(
                f"Column `{present_col}` exists on `{table_name}` but is not filtered — "
                f"if you mean 'active/inactive' users, confirm which status values to include."
            )
            confidence = "LOW"

        # ── Multi-tenant scope missing ──────────────────────────────
        tenant_cols_present = schema_cols & TENANT_COLUMNS
        tenant_cols_filtered = where_cols & TENANT_COLUMNS
        if tenant_cols_present and not tenant_cols_filtered:
            present_col = next(iter(tenant_cols_present))
            warnings.append(
                f"Column `{present_col}` exists on `{table_name}` but no tenant scope filter detected — "
                f"query will return data across ALL organizations/tenants."
            )
            confidence = "LOW"

        # ── Large table without LIMIT ───────────────────────────────
        if table_info.row_count_estimate > 100_000 and operation == "SELECT":
            try:
                parsed = sqlglot.parse_one(sql, dialect=dialect)
                if not parsed.find(exp.Limit):
                    warnings.append(
                        f"Table `{table_name}` has ~{table_info.row_count_estimate:,} rows — "
                        f"LIMIT will be applied automatically."
                    )
            except Exception:
                pass

    # ── Absolute vs relative dates ──────────────────────────────────
    try:
        parsed = sqlglot.parse_one(sql, dialect=dialect)
        for literal in parsed.walk():
            if isinstance(literal, exp.Literal) and literal.is_string:
                val = literal.this
                # Heuristic: looks like a date literal
                if len(val) == 10 and val[4] == "-" and val[7] == "-":
                    warnings.append(
                        f"Hardcoded date `{val}` detected — consider using a relative "
                        f"expression like `NOW() - INTERVAL '30 days'` if recency is intended."
                    )
                    confidence = "MEDIUM"
                    break
    except Exception:
        pass

    # ── Ambiguous column names across JOINs ────────────────────────
    if len(tables_in_query) > 1:
        col_to_tables: dict[str, list[str]] = {}
        for table_name in tables_in_query:
            table_info = _find_table_info(table_name, schema)
            if table_info:
                for col in table_info.columns:
                    col_to_tables.setdefault(col.name.lower(), []).append(table_name)

        for col_name, col_tables in col_to_tables.items():
            if len(col_tables) > 1 and col_name in where_cols:
                warnings.append(
                    f"Column `{col_name}` exists in multiple tables ({', '.join(col_tables)}) "
                    f"and is used in WHERE — ensure it is table-qualified (e.g., `{col_tables[0]}.{col_name}`)."
                )

    # ── Build assumed filters summary ───────────────────────────────
    if where_cols:
        assumed_filters = sorted(f"`{c}`" for c in where_cols)

    # ── Intent summary ──────────────────────────────────────────────
    interpreted_intent = _describe_select(sql) if operation == "SELECT" else f"{operation} operation"

    return IntentAnalysis(
        interpreted_intent=interpreted_intent,
        assumed_filters=assumed_filters,
        ambiguity_warnings=warnings,
        confidence=confidence,
    )
