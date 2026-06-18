from __future__ import annotations

"""
Database adapter abstraction layer.

All adapters implement this protocol, allowing tools to work
uniformly across PostgreSQL, MySQL, SQLite, MSSQL, etc.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass
class ColumnInfo:
    name: str
    data_type: str
    is_nullable: bool
    is_primary_key: bool = False
    is_unique: bool = False
    default_value: str | None = None
    foreign_key: str | None = None  # "referenced_table.column"


@dataclass
class TableInfo:
    name: str
    schema: str = "public"
    row_count_estimate: int = 0
    size_bytes: int = 0
    columns: list[ColumnInfo] = field(default_factory=list)
    indexes: list[str] = field(default_factory=list)


@dataclass
class SchemaSnapshot:
    """Cached snapshot of a database's structure."""
    database: str
    dialect: str               # "postgresql", "mysql", "sqlite", "mssql"
    version: str = ""
    tables: list[TableInfo] = field(default_factory=list)

    def to_markdown(self) -> str:
        """Render schema as markdown for MCP Resources + AI context."""
        lines: list[str] = [
            f"## Database: {self.database} ({self.dialect} {self.version})",
            "",
        ]
        for table in sorted(self.tables, key=lambda t: t.name):
            lines.append(f"### {table.schema}.{table.name} (~{table.row_count_estimate:,} rows)")
            lines.append("")
            lines.append("| Column | Type | Nullable | Key |")
            lines.append("|--------|------|----------|-----|")
            for col in table.columns:
                key = ""
                if col.is_primary_key:
                    key = "PRIMARY"
                elif col.is_unique:
                    key = "UNIQUE"
                elif col.foreign_key:
                    key = f"FK → {col.foreign_key}"
                nullable = "YES" if col.is_nullable else "NO"
                lines.append(f"| {col.name} | {col.data_type} | {nullable} | {key} |")
            lines.append("")
        return "\n".join(lines)


@dataclass
class QueryResult:
    columns: list[str]
    rows: list[tuple[Any, ...]]
    row_count: int
    execution_time_ms: float
    query_plan: str | None = None   # EXPLAIN output, if requested
    affected_rows: int | None = None  # For DML


@dataclass
class ExplainResult:
    estimated_cost: float
    estimated_rows: int
    plan_text: str
    warnings: list[str] = field(default_factory=list)


class DatabaseAdapter(ABC):
    """
    Abstract base for all database adapters.
    Bollard tools call this interface — never a specific driver directly.
    """

    @abstractmethod
    async def connect(self) -> None:
        """Establish the connection / pool."""

    @abstractmethod
    async def disconnect(self) -> None:
        """Close connection cleanly."""

    @abstractmethod
    async def ping(self) -> bool:
        """Check if connection is alive."""

    @abstractmethod
    async def get_schema(self) -> SchemaSnapshot:
        """Introspect the full database schema."""

    @abstractmethod
    async def execute(
        self,
        sql: str,
        params: dict[str, Any] | None = None,
        timeout: int = 30,
    ) -> QueryResult:
        """Execute a SQL statement and return results."""

    @abstractmethod
    async def explain(self, sql: str) -> ExplainResult:
        """Run EXPLAIN (or equivalent) and return cost + plan."""

    @property
    @abstractmethod
    def dialect(self) -> str:
        """Return dialect name: 'postgresql', 'mysql', 'sqlite', 'mssql'."""
