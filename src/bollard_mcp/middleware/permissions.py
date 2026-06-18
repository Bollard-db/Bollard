from __future__ import annotations

"""
Connection permission model.

Each database connection gets a permission profile at connect time.
The safety pipeline enforces these rules on every tool call.
"""

from dataclasses import dataclass, field
from typing import Literal


@dataclass
class ConnectionPermission:
    """
    Permission profile for a database connection.

    Set once at connect time and immutable during the session.
    All safety pipeline checks reference this object.
    """

    # ── Access mode ───────────────────────────────────────────────────
    mode: Literal["read_only", "read_write", "admin"] = "read_only"
    """
    read_only:  Only SELECT / EXPLAIN allowed.
    read_write: SELECT + INSERT + UPDATE + DELETE allowed (with safety guards).
    admin:      All operations including DDL. Use only for controlled environments.
    """

    # ── Table-level access control ─────────────────────────────────────
    allowed_tables: list[str] | None = None
    """
    None = all tables accessible.
    If set, ONLY these tables can be queried.
    Supports exact names only (use forbidden_tables for wildcards).
    """

    forbidden_tables: list[str] = field(default_factory=list)
    """
    Always blocked, regardless of mode.
    Supports wildcards:
      '*.passwords'   → any table ending with 'passwords'
      'auth.*'        → entire auth schema
      'users_secrets' → exact table name
    """

    # ── Query limits ───────────────────────────────────────────────────
    max_rows: int = 1000
    """Auto-LIMIT applied to all SELECT queries. Override per-query if needed."""

    max_query_cost: float = 100_000.0
    """
    Estimated PostgreSQL planner cost threshold.
    Queries above this cost trigger a preview warning before execution.
    """

    query_timeout_seconds: int = 30
    """Hard timeout on query execution. Query is cancelled if exceeded."""

    # ── Write safety ───────────────────────────────────────────────────
    require_where_on_update: bool = True
    """Block UPDATE/DELETE statements without a WHERE clause."""

    require_preview_on_write: bool = True
    """
    If True, write operations (INSERT/UPDATE/DELETE) must be
    first submitted via preview_query before execute_query is called.
    This ensures the editor AI (and user) see the impact before committing.
    """

    # ── Hard blocked operations ────────────────────────────────────────
    blocked_operations: list[str] = field(
        default_factory=lambda: [
            "DROP TABLE",
            "DROP DATABASE",
            "DROP SCHEMA",
            "TRUNCATE",
            "DROP INDEX",
            "DROP VIEW",
        ]
    )
    """Operations always blocked regardless of mode (unless mode='admin')."""

    def describe(self) -> str:
        """Return a human-readable description of this permission profile."""
        lines = [
            f"**Mode:** `{self.mode}`",
            f"**Max rows:** {self.max_rows:,}",
            f"**Query timeout:** {self.query_timeout_seconds}s",
            f"**Require WHERE on UPDATE/DELETE:** {'Yes' if self.require_where_on_update else 'No'}",
            f"**Preview required on writes:** {'Yes' if self.require_preview_on_write else 'No'}",
        ]
        if self.forbidden_tables:
            lines.append(f"**Forbidden tables:** {', '.join(f'`{t}`' for t in self.forbidden_tables)}")
        if self.allowed_tables is not None:
            lines.append(f"**Allowed tables:** {', '.join(f'`{t}`' for t in self.allowed_tables)}")
        return "\n".join(lines)


# ── Presets ───────────────────────────────────────────────────────────────

def production_readonly() -> ConnectionPermission:
    """Safest preset for production databases."""
    return ConnectionPermission(
        mode="read_only",
        max_rows=500,
        query_timeout_seconds=15,
        forbidden_tables=["*.passwords", "*.secrets", "*.api_keys", "auth.*"],
    )


def development_readwrite() -> ConnectionPermission:
    """Standard preset for development/staging databases."""
    return ConnectionPermission(
        mode="read_write",
        max_rows=1000,
        query_timeout_seconds=30,
        require_where_on_update=True,
        require_preview_on_write=True,
        forbidden_tables=["*.passwords", "*.secrets"],
    )


def admin_full() -> ConnectionPermission:
    """Full access preset. Use with extreme caution."""
    return ConnectionPermission(
        mode="admin",
        max_rows=5000,
        query_timeout_seconds=120,
        require_where_on_update=False,
        require_preview_on_write=False,
        blocked_operations=[],
    )
