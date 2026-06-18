from __future__ import annotations

"""
Feedback tools — log_correction and get_query_history.

These form the correction flow (UX Loop Gap #4):
1. User sees wrong result
2. Editor AI calls log_correction with the fix
3. Correction stored in session + persisted to disk
4. MCP Resource exposes corrections for future AI context
5. AI reads corrections automatically → avoids repeating mistakes
"""

from ..state.session import get_session, Correction
from ..formatters.markdown import format_error


async def log_correction(
    connection: str,
    original_query: str,
    corrected_query: str,
    note: str,
) -> str:
    """
    Log a query correction for future AI context.

    When the editor AI generates a wrong query and the user corrects it,
    log the correction here. Bollard persists it and exposes it via the
    bollard://corrections/{alias} MCP Resource, so the AI automatically
    learns from past mistakes without the user repeating themselves.

    Args:
        connection: Database alias.
        original_query: The incorrect SQL that was generated.
        corrected_query: The correct SQL (or empty if just a note).
        note: Plain English explanation of what was wrong and why.
              Examples:
              - "Exclude test accounts: email LIKE '%@test.com%'"
              - "Use created_at, not signup_date — signup_date is deprecated"
              - "active users means subscription_status = 'active', not last_login"
    """
    session = get_session()
    conn_obj = session.get_connection(connection)
    if not conn_obj:
        return format_error(f"No active connection `{connection}`.")

    correction = Correction(
        original_query=original_query,
        corrected_query=corrected_query,
        note=note,
        connection_alias=connection,
    )
    session.add_correction(correction)

    return (
        f"✅ Correction logged for `{connection}`.  \n"
        f"**Note:** {note}  \n\n"
        f"This correction is now part of the AI's context for this database "
        f"and will be applied automatically in future queries."
    )


async def get_query_history(connection: str, last_n: int = 10) -> str:
    """
    Return recent query history for a connection.

    Useful for the editor AI to understand what has been executed recently,
    especially when the user says "run that again" or "fix the last query."

    Args:
        connection: Database alias.
        last_n: Number of recent queries to return (max 50, default 10).
    """
    session = get_session()
    if not session.get_connection(connection):
        return format_error(f"No active connection `{connection}`.")

    capped = min(last_n, 50)
    return session.history_to_markdown(connection, capped)


async def get_corrections(connection: str) -> str:
    """
    Return all logged corrections for a connection.

    The editor AI reads this via the bollard://corrections/{alias}
    MCP Resource automatically. Call this tool directly to inspect them.

    Args:
        connection: Database alias.
    """
    session = get_session()
    if not session.get_connection(connection):
        return format_error(f"No active connection `{connection}`.")

    return session.corrections_to_markdown(connection)
