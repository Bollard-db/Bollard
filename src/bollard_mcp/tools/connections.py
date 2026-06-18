from __future__ import annotations

"""
Connection tools — connect, disconnect, list_connections.

These are the entry points for all database interactions.
Every other tool requires a connected alias.
"""

from ..adapters.sqlalchemy_adapter import SQLAlchemyAdapter, _sanitize_db_url
from ..credentials import CredentialStore
from ..middleware.permissions import ConnectionPermission
from ..state.session import get_session, ActiveConnection
from ..formatters.markdown import format_connection_list, format_error


async def connect_database(
    connection_string: str,
    alias: str,
    mode: str = "read_only",
    max_rows: int = 1000,
    forbidden_tables: list[str] | None = None,
    save_credential: bool = True,
    output_mode: str = "smart",
) -> str:
    """
    Connect to a database.

    Args:
        connection_string: Full database URL.
            PostgreSQL: postgresql://user:pass@host:5432/dbname
            MySQL:      mysql://user:pass@host:3306/dbname
            SQLite:     sqlite:///path/to/file.db
            MSSQL:      mssql://user:pass@host:1433/dbname
        alias: Short name for this connection (e.g., 'prod', 'staging').
        mode: Permission mode — 'read_only' | 'read_write' | 'admin'.
            Default: 'read_only' (safest).
        max_rows: Maximum rows returned by SELECT queries (auto-LIMIT).
        forbidden_tables: Tables to block access to. Supports wildcards:
            '*.passwords', 'auth.*', 'users_secrets'
        save_credential: If True, saves to OS Keyring for future sessions.
        output_mode: Controls how query results are returned to the AI.
            'smart'     (default) — Full results for small queries;
                        10-row sample + column stats for large ones.
            'raw'       — Always return full raw rows (good for debugging).
            'analytics' — Return only column statistics, zero rows
                          (good for Snowflake / BigQuery / data warehouses).

    Returns:
        Confirmation message with connection details.
    """
    session = get_session()
    connection_string = _sanitize_db_url(connection_string)

    existing = session.get_connection(alias)
    if existing:
        return format_error(
            f"Alias `{alias}` is already connected.",
            f"Use `disconnect(alias='{alias}')` first, or choose a different alias.",
        )

    permission = ConnectionPermission(
        mode=mode,  # type: ignore[arg-type]
        max_rows=max_rows,
        forbidden_tables=forbidden_tables or [],
    )

    adapter = SQLAlchemyAdapter(connection_string)
    try:
        await adapter.connect()
    except Exception as e:
        return format_error(
            f"Failed to connect to `{alias}`",
            str(e),
        )

    if save_credential:
        try:
            store = CredentialStore()
            store.save(alias, adapter._original_url)
        except Exception:
            pass  # Credential saving is best-effort and non-fatal

    conn = ActiveConnection(
        alias=alias,
        connection_string=adapter._original_url,
        adapter=adapter,
        permission=permission,
        output_mode=output_mode,
    )
    session.add_connection(conn)

    # Populate the schema cache
    try:
        snapshot = await adapter.get_schema()
        from ..config import get_settings
        session.set_schema_cache(alias, snapshot, ttl=get_settings().schema_cache_ttl)
        table_count = len(snapshot.tables)
    except Exception:
        table_count = 0

    ssl_note = ""
    if getattr(adapter, "ssl_auto_applied", False):
        ssl_note = "- **SSL:** Automatically enabled (`sslmode=require`)\n"

    return (
        f"✅ **Connected to `{alias}`**\n\n"
        f"- **Dialect:** {adapter.dialect}\n"
        f"- **Mode:** `{mode}`\n"
        f"- **Output mode:** `{output_mode}`\n"
        f"- **Max rows:** {max_rows:,}\n"
        f"- **Tables discovered:** {table_count}\n"
        + ssl_note
        + (f"- **Forbidden tables:** {', '.join(f'`{t}`' for t in (forbidden_tables or []))}\n" if forbidden_tables else "")
        + f"\nSchema is cached and available to the AI. Use `list_tables(connection='{alias}')` to explore."
    )


async def disconnect(alias: str) -> str:
    """
    Disconnect from a database.

    Args:
        alias: The connection alias to disconnect.
    """
    session = get_session()
    conn = session.get_connection(alias)
    if not conn:
        return format_error(f"No active connection with alias `{alias}`.")

    await conn.adapter.disconnect()
    session.remove_connection(alias)
    return f"✅ Disconnected from `{alias}`."


async def list_connections() -> str:
    """
    List all currently active database connections.

    Returns alias, dialect, permission mode, and connection time.
    """
    session = get_session()
    return format_connection_list(session.list_connections())


async def reconnect_saved(alias: str) -> str:
    """
    Reconnect to a previously saved connection from the OS Keyring.

    Args:
        alias: The saved connection alias to restore.
    """
    try:
        store = CredentialStore()
        connection_string = store.retrieve(alias)
        if not connection_string:
            return format_error(
                f"No saved credential found for `{alias}`.",
                "Use `connect_database` with `save_credential=True` to save it.",
            )
        return await connect_database(connection_string, alias, save_credential=False)
    except Exception as e:
        return format_error(f"Failed to reconnect `{alias}`", str(e))
