from __future__ import annotations

"""
Schema tools — list_tables, describe_table, get_sample_data, refresh_schema.

These tools expose database structure as readable markdown,
giving the editor AI full context before generating queries.
"""

from ..state.session import get_session
from ..formatters.markdown import format_schema, format_error
from ..config import get_settings


async def list_tables(connection: str) -> str:
    """
    List all tables in the connected database with row counts and sizes.

    The editor AI uses this to understand the database structure
    before generating queries. Schema is served from cache when available.

    Args:
        connection: Database alias (from connect_database).
    """
    session = get_session()
    conn = session.get_connection(connection)
    if not conn:
        return format_error(f"No active connection `{connection}`.")

    # Try cache first
    schema = session.get_cached_schema(connection)
    if not schema:
        try:
            schema = await conn.adapter.get_schema()
            settings = get_settings()
            session.set_schema_cache(connection, schema, ttl=settings.schema_cache_ttl)
        except Exception as e:
            return format_error("Failed to introspect schema", str(e))

    if not schema.tables:
        return f"✅ Connected to `{connection}` ({schema.dialect}) — no tables found."

    lines = [
        f"## Tables in `{connection}` ({schema.dialect} {schema.version})",
        "",
        f"**{len(schema.tables)} table(s) found**",
        "",
        "| Table | Schema | Rows (est.) | Columns |",
        "|-------|--------|-------------|---------|",
    ]
    for table in sorted(schema.tables, key=lambda t: t.name):
        lines.append(
            f"| `{table.name}` | {table.schema} | {table.row_count_estimate:,} | {len(table.columns)} |"
        )

    lines += [
        "",
        f"Use `describe_table(connection='{connection}', table_name='<name>')` for column details.",
    ]
    return "\n".join(lines)


async def describe_table(connection: str, table_name: str) -> str:
    """
    Show full column definitions, types, constraints, and indexes for a table.

    Includes: column names, data types, nullable, primary key, unique, foreign keys.
    The editor AI reads this to understand the exact schema before generating queries.

    Args:
        connection: Database alias.
        table_name: Table to describe (exact name, case-sensitive).
    """
    session = get_session()
    conn = session.get_connection(connection)
    if not conn:
        return format_error(f"No active connection `{connection}`.")

    schema = session.get_cached_schema(connection)
    if not schema:
        try:
            schema = await conn.adapter.get_schema()
            settings = get_settings()
            session.set_schema_cache(connection, schema, ttl=settings.schema_cache_ttl)
        except Exception as e:
            return format_error("Failed to introspect schema", str(e))

    # Find the table
    table = next(
        (t for t in schema.tables if t.name.lower() == table_name.lower()),
        None,
    )
    if not table:
        available = ", ".join(f"`{t.name}`" for t in sorted(schema.tables, key=lambda x: x.name)[:10])
        return format_error(
            f"Table `{table_name}` not found.",
            f"Available tables: {available}{'...' if len(schema.tables) > 10 else ''}",
        )

    lines = [
        f"## `{table.schema}.{table.name}` (~{table.row_count_estimate:,} rows)",
        "",
        "| Column | Type | Nullable | Key | Default | Foreign Key |",
        "|--------|------|----------|-----|---------|-------------|",
    ]
    for col in table.columns:
        key = ""
        if col.is_primary_key:
            key = "🔑 PRIMARY"
        elif col.is_unique:
            key = "UNIQUE"
        nullable = "YES" if col.is_nullable else "NO"
        default = col.default_value or ""
        fk = col.foreign_key or ""
        lines.append(
            f"| `{col.name}` | `{col.data_type}` | {nullable} | {key} | {default} | {fk} |"
        )

    if table.indexes:
        lines += ["", f"**Indexes:** {', '.join(f'`{i}`' for i in table.indexes)}"]

    return "\n".join(lines)


async def get_sample_data(connection: str, table_name: str, limit: int = 5) -> str:
    """
    Preview a few rows from a table to understand its data shape.

    Useful for the editor AI to understand the actual values in the database
    before generating queries (e.g., what status values exist, date formats, etc.)

    Args:
        connection: Database alias.
        table_name: Table to sample.
        limit: Number of rows to return (max 25, default 5).
    """
    session = get_session()
    conn = session.get_connection(connection)
    if not conn:
        return format_error(f"No active connection `{connection}`.")

    # Respect forbidden tables
    from ..safety.validator import validate_query
    validation = validate_query(
        sql=f"SELECT * FROM {table_name}",
        mode=conn.permission.mode,
        forbidden_tables=conn.permission.forbidden_tables,
        dialect=conn.adapter.dialect,
    )
    if not validation.is_allowed:
        return format_error(f"Access to `{table_name}` is blocked.", validation.blocked_reason)

    capped_limit = min(limit, 25)
    sql = f'SELECT * FROM "{table_name}" LIMIT {capped_limit}'

    try:
        result = await conn.adapter.execute(sql)
        from ..formatters.markdown import format_query_result
        return f"## Sample data from `{table_name}` (first {capped_limit} rows)\n\n" + format_query_result(result)
    except Exception as e:
        return format_error(f"Failed to sample `{table_name}`", str(e))


async def refresh_schema(connection: str) -> str:
    """
    Force a schema cache refresh for a connection.

    Call this after CREATE TABLE, ALTER TABLE, or any DDL operation
    to ensure the AI has up-to-date schema context.

    Args:
        connection: Database alias.
    """
    session = get_session()
    conn = session.get_connection(connection)
    if not conn:
        return format_error(f"No active connection `{connection}`.")

    session.invalidate_schema(connection)
    try:
        schema = await conn.adapter.get_schema()
        settings = get_settings()
        session.set_schema_cache(connection, schema, ttl=settings.schema_cache_ttl)
        return (
            f"✅ Schema refreshed for `{connection}`.  \n"
            f"Found **{len(schema.tables)} tables** ({schema.dialect} {schema.version})."
        )
    except Exception as e:
        return format_error("Schema refresh failed", str(e))
