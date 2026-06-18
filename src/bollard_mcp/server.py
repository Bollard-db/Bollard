from __future__ import annotations

"""
Bollard MCP Server — Entry Point

Registers all MCP tools and resources.
Run via: bollard-mcp (CLI) or python -m bollard_mcp.server

Integrates with:
- Cursor:       .cursor/mcp.json
- VS Code:      .vscode/mcp.json
- Claude Desktop: ~/Library/Application Support/Claude/claude_desktop_config.json
"""

import asyncio
from fastmcp import FastMCP

from .config import get_settings
from .state.session import get_session

# Tools
from .tools.connections import (
    connect_database,
    disconnect,
    list_connections,
    reconnect_saved,
)
from .tools.schema import (
    list_tables,
    describe_table,
    get_sample_data,
    refresh_schema,
)
from .tools.query import (
    preview_query,
    execute_query,
)
from .tools.profiler import profile_table
from .tools.feedback import (
    log_correction,
    get_query_history,
    get_corrections,
)

# Server Setup

settings = get_settings()

mcp = FastMCP(
    name=settings.server_name,
    instructions="""
Bollard is a safe, stateful database access layer and AI context optimizer.

## How to use Bollard

1. Connect first:
   `connect_database(connection_string="postgresql://...", alias="prod", mode="read_only", output_mode="smart")`

   output_mode options:
   - 'smart'     (default) — Full results for small queries; 10-row sample + stats for large ones.
   - 'raw'       — Always return full raw rows (debugging, seed scripts).
   - 'analytics' — Zero rows to AI; column stats only (data warehouses).

2. Explore the schema:
   `list_tables(connection="prod")`
   `describe_table(connection="prod", table_name="users")`
   `profile_table(connection="prod", table_name="users")`   ← full column statistics

3. Preview before executing (ALWAYS do this for non-trivial queries):
   `preview_query(connection="prod", sql="SELECT ...")`
   → Bare `SELECT * FROM table` is auto-intercepted and redirected to profile_table for large tables.

4. Execute:
   `execute_query(connection="prod", sql="SELECT ...")`

   Risk tiers for write operations:
   - LOW      (SELECT)        → auto-execute
   - MEDIUM   (small write)   → OS PIN required
   - HIGH     (bulk write)    → OS PIN + typed phrase (e.g. "confirm update 12000 rows")
   - CRITICAL (ALTER TABLE)   → OS PIN + suggested reversal review + type "confirm migration"
   - EXTREME  (DROP/TRUNCATE) → admin mode required

5. Profile a table for AI context:
   `profile_table(connection="prod", table_name="orders")`
   → Returns COUNT, NULL%, MIN/MAX, distinct count, and top-5 distributions.
   → All computed in SQL. Zero rows transferred to AI context.

6. Log corrections (so Bollard learns for next time):
   `log_correction(connection="prod", original_query="...", corrected_query="...", note="...")`

## Important Rules
- Bollard does NOT generate SQL. The editor AI generates SQL.
- Bollard validates, executes, and returns results.
- preview_query MUST be called before execute_query for write operations.
- Auto-LIMIT is applied to all SELECT queries (configurable per connection).
""",
)

# Tool Registrations

# Connection management
mcp.tool()(connect_database)
mcp.tool()(disconnect)
mcp.tool()(list_connections)
mcp.tool()(reconnect_saved)

# Schema exploration
mcp.tool()(list_tables)
mcp.tool()(describe_table)
mcp.tool()(get_sample_data)
mcp.tool()(refresh_schema)

# Query execution
mcp.tool()(preview_query)
mcp.tool()(execute_query)

# Table profiler
mcp.tool()(profile_table)

# Feedback & corrections
mcp.tool()(log_correction)
mcp.tool()(get_query_history)
mcp.tool()(get_corrections)

# Resource Registrations

@mcp.resource("bollard://connections")
async def connections_resource() -> str:
    """All active database connections. Read by the AI to know what's available."""
    session = get_session()
    conns = session.list_connections()
    if not conns:
        return "No active connections. Use `connect_database` to connect."
    lines = ["## Active Bollard Connections", ""]
    for c in conns:
        lines.append(f"- **{c['alias']}** ({c['dialect']}, mode={c['mode']})")
    return "\n".join(lines)


@mcp.resource("bollard://schema/{alias}")
async def schema_resource(alias: str) -> str:
    """
    Full schema blueprint for a connection.
    The AI reads this automatically to understand the database structure
    before deciding what queries to generate.
    """
    session = get_session()
    conn = session.get_connection(alias)
    if not conn:
        return f"No active connection `{alias}`. Use `connect_database` first."

    schema = session.get_cached_schema(alias)
    if not schema:
        try:
            schema = await conn.adapter.get_schema()
            session.set_schema_cache(alias, schema)
        except Exception as e:
            return f"Failed to load schema for `{alias}`: {e}"

    return schema.to_markdown()


@mcp.resource("bollard://history/{alias}")
async def history_resource(alias: str) -> str:
    """
    Recent query history for a connection.
    The AI reads this for context continuity across turns.
    """
    session = get_session()
    return session.history_to_markdown(alias, last_n=10)


@mcp.resource("bollard://corrections/{alias}")
async def corrections_resource(alias: str) -> str:
    """
    User corrections and preferences for a connection.

    The AI reads this automatically so it learns from past mistakes
    without the user repeating themselves every session.

    Example entries:
    - "active users = subscription_status = 'active', not last_login-based"
    - "Always exclude email LIKE '%@test.com%' from user counts"
    - "Use created_at, not signup_date — signup_date column is deprecated"
    """
    session = get_session()
    return session.corrections_to_markdown(alias)


@mcp.resource("bollard://policies/{alias}")
async def policies_resource(alias: str) -> str:
    """
    Active permission policy for a connection.
    The AI reads this to understand what operations are allowed.
    """
    session = get_session()
    conn = session.get_connection(alias)
    if not conn:
        return f"No active connection `{alias}`."
    return f"## Permission Policy — `{alias}`\n\n{conn.permission.describe()}"


# CLI Entry Point

def main() -> None:
    """CLI entry point: `bollard-mcp`"""
    mcp.run(transport="stdio")


if __name__ == "__main__":
    main()
