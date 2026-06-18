from __future__ import annotations

"""
SQLAlchemy-based database adapter.

Supports: PostgreSQL, MySQL/MariaDB, SQLite, MS SQL Server, Oracle.
Uses SQLAlchemy Core for schema introspection and asyncio drivers for execution.
"""

import ssl
import time
from typing import Any
from urllib.parse import urlparse, parse_qsl, urlencode, urlunparse

import sqlalchemy as sa
from sqlalchemy import text, inspect
from sqlalchemy.ext.asyncio import create_async_engine, AsyncEngine

from .base import (
    DatabaseAdapter,
    SchemaSnapshot,
    TableInfo,
    ColumnInfo,
    QueryResult,
    ExplainResult,
)


def _append_sslmode(url: str, mode: str = "require") -> str:
    """Append or set the sslmode query parameter on a connection string."""
    try:
        parsed = urlparse(url)
        scheme = parsed.scheme.lower()
        if not ("postgresql" in scheme or "postgres" in scheme):
            return url
        query_params = dict(parse_qsl(parsed.query))
        query_params["sslmode"] = mode
        new_query = urlencode(query_params)
        new_parts = list(parsed)
        new_parts[4] = new_query
        return urlunparse(new_parts)
    except Exception:
        return url


def _sanitize_db_url(url: str) -> str:
    """Optionally append sslmode=require for known cloud databases that require SSL."""
    try:
        parsed = urlparse(url)
        scheme = parsed.scheme.lower()
        if not ("postgresql" in scheme or "postgres" in scheme):
            return url

        query_params = dict(parse_qsl(parsed.query))
        if "sslmode" in query_params:
            return url

        host = (parsed.hostname or "").lower()
        known_ssl_hosts = [
            ".supabase.co",
            ".supabase.com",
            ".supabase.net",
            ".neon.tech",
            ".render.com",
            ".elephantsql.com",
            ".rds.amazonaws.com",
        ]

        should_require_ssl = False
        for kh in known_ssl_hosts:
            if host.endswith(kh):
                should_require_ssl = True
                break

        if should_require_ssl:
            return _append_sslmode(url, "require")
    except Exception:
        pass
    return url


def _strip_ssl_params(url: str) -> tuple[str, bool]:
    """
    Strips sslmode and ssl parameters from the URL query string to prevent
    driver errors (like asyncpg TypeError) and returns whether SSL was requested.
    """
    try:
        parsed = urlparse(url)
        scheme = parsed.scheme.lower()
        if not ("postgresql" in scheme or "postgres" in scheme):
            return url, False

        query_params = dict(parse_qsl(parsed.query))

        has_ssl = False
        ssl_val = str(query_params.get("sslmode", query_params.get("ssl", ""))).lower()
        if ssl_val in ("require", "prefer", "verify-ca", "verify-full", "true", "1", "yes"):
            has_ssl = True

        # Strip both params to prevent driver failures
        query_params.pop("sslmode", None)
        query_params.pop("ssl", None)

        new_query = urlencode(query_params)
        new_parts = list(parsed)
        new_parts[4] = new_query
        return urlunparse(new_parts), has_ssl
    except Exception:
        return url, False


def _get_ssl_argument(insecure: bool = False) -> ssl.SSLContext | bool:
    """Create an SSL context or return boolean based on security configuration."""
    if not insecure:
        return True
    try:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        return ctx
    except Exception:
        return True


def _to_async_url(connection_string: str) -> str:
    """Convert a standard connection string to its async driver variant."""
    parsed = urlparse(connection_string)
    scheme = parsed.scheme.lower()

    replacements = {
        "postgresql": "postgresql+asyncpg",
        "postgres": "postgresql+asyncpg",
        "mysql": "mysql+aiomysql",
        "mysql+mysqldb": "mysql+aiomysql",
        "sqlite": "sqlite+aiosqlite",
        "mssql": "mssql+aioodbc",
        "mssql+pyodbc": "mssql+aioodbc",
    }

    for src, dst in replacements.items():
        if scheme == src or scheme.startswith(src + "+"):
            return connection_string.replace(scheme, dst, 1)

    return connection_string  # Already async or unknown — pass through


def _detect_dialect(connection_string: str) -> str:
    """Detect dialect from connection string scheme."""
    scheme = urlparse(connection_string).scheme.lower()
    if "postgresql" in scheme or "postgres" in scheme:
        return "postgresql"
    if "mysql" in scheme or "mariadb" in scheme:
        return "mysql"
    if "sqlite" in scheme:
        return "sqlite"
    if "mssql" in scheme or "sqlserver" in scheme:
        return "mssql"
    if "oracle" in scheme:
        return "oracle"
    return "unknown"


class SQLAlchemyAdapter(DatabaseAdapter):
    """Universal adapter for SQL databases via SQLAlchemy + async drivers."""

    def __init__(self, connection_string: str) -> None:
        sanitized = _sanitize_db_url(connection_string)
        self._original_url = sanitized
        self._async_url = _to_async_url(sanitized)
        self._dialect = _detect_dialect(sanitized)
        self._engine: AsyncEngine | None = None
        self.ssl_auto_applied = (sanitized != connection_string)

    @property
    def dialect(self) -> str:
        return self._dialect

    # Lifecycle

    async def connect(self) -> None:
        # Strip SSL query params from async URL to avoid asyncpg TypeError,
        # but capture if SSL was requested (either user-specified or auto-sanitized).
        async_url_clean, has_ssl = _strip_ssl_params(self._async_url)

        connect_args = {}
        if self._dialect == "postgresql":
            if has_ssl:
                connect_args["ssl"] = True
            
            # If the host is a known pooler/pgbouncer, disable prepared statements
            try:
                parsed = urlparse(self._async_url)
                host = (parsed.hostname or "").lower()
                if "pooler" in host or "pgbouncer" in host:
                    connect_args["statement_cache_size"] = 0
            except Exception:
                pass

        try:
            self._engine = create_async_engine(
                async_url_clean,
                pool_size=5,
                max_overflow=10,
                pool_timeout=10,
                pool_recycle=3600,
                echo=False,
                connect_args=connect_args,
            )
            await self.ping()
        except Exception as e:
            err_str = str(e).lower()
            is_ssl_err = "certificate verify failed" in err_str or "certverificationerror" in err_str or "ssl" in err_str or "handshake" in err_str

            # Clean up the failed engine
            if self._engine:
                try:
                    await self._engine.dispose()
                except Exception:
                    pass

            if self._dialect == "postgresql":
                # Insecure SSL fallback for databases with self-signed/untrusted certificates
                if connect_args.get("ssl") == True and is_ssl_err:
                    connect_args["ssl"] = _get_ssl_argument(insecure=True)
                    self._engine = create_async_engine(
                        async_url_clean,
                        pool_size=5,
                        max_overflow=10,
                        pool_timeout=10,
                        pool_recycle=3600,
                        echo=False,
                        connect_args=connect_args,
                    )
                    await self.ping()
                    return

                if not has_ssl:
                    self._original_url = _append_sslmode(self._original_url, "require")
                    self._async_url = _append_sslmode(self._async_url, "require")
                    self.ssl_auto_applied = True

                    # Try connecting using SSL first
                    connect_args["ssl"] = True
                    try:
                        self._engine = create_async_engine(
                            async_url_clean,
                            pool_size=5,
                            max_overflow=10,
                            pool_timeout=10,
                            pool_recycle=3600,
                            echo=False,
                            connect_args=connect_args,
                        )
                        await self.ping()
                    except Exception as e2:
                        e2_str = str(e2).lower()
                        is_ssl_err2 = "certificate verify failed" in e2_str or "certverificationerror" in e2_str or "ssl" in e2_str or "handshake" in e2_str

                        if is_ssl_err2:
                            if self._engine:
                                try:
                                    await self._engine.dispose()
                                except Exception:
                                    pass

                            # Fallback to insecure SSL context if verify fails
                            connect_args["ssl"] = _get_ssl_argument(insecure=True)
                            self._engine = create_async_engine(
                                async_url_clean,
                                pool_size=5,
                                max_overflow=10,
                                pool_timeout=10,
                                pool_recycle=3600,
                                echo=False,
                                connect_args=connect_args,
                            )
                            await self.ping()
                        else:
                            raise e2
                    return

            # Reraise connection exception if we cannot establish a connection
            raise e

    async def disconnect(self) -> None:
        if self._engine:
            await self._engine.dispose()
            self._engine = None

    async def ping(self) -> bool:
        assert self._engine, "Not connected"
        async with self._engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return True

    # Schema Introspection

    async def get_schema(self) -> SchemaSnapshot:
        assert self._engine, "Not connected"

        # Run sync introspection in a thread (SQLAlchemy Inspector is sync)
        import asyncio
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._introspect_sync)

    def _introspect_sync(self) -> SchemaSnapshot:
        """Synchronous schema introspection via SQLAlchemy Inspector."""
        # Create a temporary synchronous connection for metadata inspection
        sync_url = self._original_url
        engine = sa.create_engine(sync_url, pool_pre_ping=True)
        insp = inspect(engine)

        db_name = engine.url.database or "unknown"
        version = ""
        try:
            with engine.connect() as conn:
                if self._dialect == "postgresql":
                    version = conn.execute(text("SELECT version()")).scalar() or ""
                    version = version.split(" ")[1] if " " in version else version
                elif self._dialect == "mysql":
                    version = conn.execute(text("SELECT VERSION()")).scalar() or ""
                elif self._dialect == "sqlite":
                    version = conn.execute(text("SELECT sqlite_version()")).scalar() or ""
        except Exception:
            pass

        tables: list[TableInfo] = []
        schema_names = insp.get_schema_names()
        
        # Filter out noisy internal and extension schemas to avoid slow WAN introspection queries
        ignored_schemas = {
            "information_schema", "pg_catalog", "sys", "graphql", 
            "graphql_public", "realtime", "extensions", "vault",
            "auth", "storage"
        }
        
        target_schemas = []
        for s in schema_names:
            s_lower = s.lower()
            if s_lower in ignored_schemas:
                continue
            if s_lower.startswith("pg_") or s_lower.startswith("pg_temp") or s_lower.startswith("pg_toast"):
                continue
            target_schemas.append(s)

        for schema in target_schemas:
            for table_name in insp.get_table_names(schema=schema):
                try:
                    columns = self._get_columns(insp, table_name, schema)
                    row_estimate = self._estimate_row_count(engine, table_name, schema)
                    indexes = [idx["name"] for idx in insp.get_indexes(table_name, schema=schema) if idx.get("name")]

                    tables.append(TableInfo(
                        name=table_name,
                        schema=schema,
                        row_count_estimate=row_estimate,
                        columns=columns,
                        indexes=indexes,
                    ))
                except Exception:
                    continue  # Skip tables we can't introspect

        engine.dispose()
        return SchemaSnapshot(
            database=db_name,
            dialect=self._dialect,
            version=version,
            tables=tables,
        )

    def _get_columns(self, insp: Any, table_name: str, schema: str) -> list[ColumnInfo]:
        columns = []
        pk_cols = set(insp.get_pk_constraint(table_name, schema=schema).get("constrained_columns", []))
        unique_cols: set[str] = set()
        for uc in insp.get_unique_constraints(table_name, schema=schema):
            unique_cols.update(uc.get("column_names", []))

        fk_map: dict[str, str] = {}
        for fk in insp.get_foreign_keys(table_name, schema=schema):
            for col in fk.get("constrained_columns", []):
                ref_table = fk.get("referred_table", "")
                ref_cols = fk.get("referred_columns", [])
                ref_col = ref_cols[0] if ref_cols else ""
                fk_map[col] = f"{ref_table}.{ref_col}"

        for col in insp.get_columns(table_name, schema=schema):
            columns.append(ColumnInfo(
                name=col["name"],
                data_type=str(col["type"]),
                is_nullable=col.get("nullable", True),
                is_primary_key=col["name"] in pk_cols,
                is_unique=col["name"] in unique_cols,
                default_value=str(col["default"]) if col.get("default") is not None else None,
                foreign_key=fk_map.get(col["name"]),
            ))
        return columns

    def _estimate_row_count(self, engine: Any, table_name: str, schema: str) -> int:
        try:
            with engine.connect() as conn:
                if self._dialect == "postgresql":
                    result = conn.execute(
                        text(
                            "SELECT reltuples::bigint FROM pg_class c "
                            "JOIN pg_namespace n ON n.oid = c.relnamespace "
                            "WHERE c.relname = :t AND n.nspname = :s"
                        ),
                        {"t": table_name, "s": schema},
                    ).scalar()
                    return int(result or 0)
                elif self._dialect == "mysql":
                    result = conn.execute(
                        text(
                            "SELECT TABLE_ROWS FROM information_schema.TABLES "
                            "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :t"
                        ),
                        {"t": table_name},
                    ).scalar()
                    return int(result or 0)
                else:
                    # Fallback row count for SQLite or unknown dialects
                    result = conn.execute(
                        text(f'SELECT COUNT(*) FROM "{schema}"."{table_name}"')
                    ).scalar()
                    return int(result or 0)
        except Exception:
            return 0

    # Query Execution

    async def execute(
        self,
        sql: str,
        params: dict[str, Any] | None = None,
        timeout: int = 30,
    ) -> QueryResult:
        assert self._engine, "Not connected"

        start = time.monotonic()
        async with self._engine.connect() as conn:
            result = await conn.execute(text(sql), params or {})
            elapsed_ms = (time.monotonic() - start) * 1000

            if result.returns_rows:
                columns = list(result.keys())
                rows = result.fetchall()
                return QueryResult(
                    columns=columns,
                    rows=[tuple(row) for row in rows],
                    row_count=len(rows),
                    execution_time_ms=elapsed_ms,
                )
            else:
                await conn.commit()
                return QueryResult(
                    columns=[],
                    rows=[],
                    row_count=0,
                    execution_time_ms=elapsed_ms,
                    affected_rows=result.rowcount,
                )

    async def explain(self, sql: str) -> ExplainResult:
        assert self._engine, "Not connected"

        if self._dialect == "postgresql":
            explain_sql = f"EXPLAIN (FORMAT JSON) {sql}"
        elif self._dialect == "mysql":
            explain_sql = f"EXPLAIN {sql}"
        elif self._dialect == "sqlite":
            explain_sql = f"EXPLAIN QUERY PLAN {sql}"
        else:
            return ExplainResult(estimated_cost=0.0, estimated_rows=0, plan_text="EXPLAIN not supported")

        try:
            async with self._engine.connect() as conn:
                result = await conn.execute(text(explain_sql))
                rows = result.fetchall()

                if self._dialect == "postgresql":
                    import json
                    raw_plan = rows[0][0]
                    if isinstance(raw_plan, str):
                        plan_json = json.loads(raw_plan)
                    else:
                        plan_json = raw_plan
                    
                    plan_node = plan_json[0]["Plan"]
                    cost = plan_node.get("Total Cost", 0.0)
                    est_rows = plan_node.get("Plan Rows", 0)
                    plan_text = json.dumps(plan_json, indent=2)
                    return ExplainResult(
                        estimated_cost=float(cost),
                        estimated_rows=int(est_rows),
                        plan_text=plan_text,
                    )
                else:
                    plan_text = "\n".join(str(row) for row in rows)
                    return ExplainResult(
                        estimated_cost=0.0,
                        estimated_rows=0,
                        plan_text=plan_text,
                    )
        except Exception as e:
            return ExplainResult(
                estimated_cost=0.0,
                estimated_rows=0,
                plan_text=f"EXPLAIN failed: {e}",
                warnings=[str(e)],
            )
