from __future__ import annotations

"""
Query tools — preview_query and execute_query.

preview_query: Full pipeline — safety + intent analysis + EXPLAIN.
               The editor AI SHOULD call this before execute_query.

execute_query: Execute through safety pipeline with risk-tiered gating:
  LOW      (SELECT)           → auto-execute
  MEDIUM   (small write)      → OS PIN required
  HIGH     (bulk write ≥5)    → OS PIN + typed confirmation phrase
  CRITICAL (ALTER TABLE)      → OS PIN + suggested reversal shown
  EXTREME  (DROP / TRUNCATE)  → admin mode required
"""

import sys
import os
import urllib.request
import json
import re
from ..state.session import get_session, QueryRecord
from ..safety.validator import (
    validate_query, inject_limit, detect_operation,
    score_risk, generate_suggested_reversal, RiskLevel,
    is_table_forbidden,
)
from ..safety.intent_validator import analyze_intent
from ..formatters.markdown import (
    format_query_result, format_preview, format_error,
    format_smart_result, format_analytics_result, format_risk_gate,
)
from ..config import get_settings

# Human-in-the-loop in-chat validation state
_active_pins: dict[str, str] = {}

# Pending confirmation phrases for HIGH risk (bulk writes)
_pending_phrases: dict[str, str] = {}

# Smart-mode threshold: queries returning more than this many rows
# will be compressed into a sample + stats summary.
_SMART_THRESHOLD = 15


def request_extension_pin(connection_alias: str, sql: str) -> str:
    """Request a temporary write confirmation PIN from the VS Code extension bridge or generate locally."""
    port = os.environ.get("BOLLARD_EXTENSION_PORT")
    if not port:
        import random
        pin = str(random.randint(1000, 9999))
        _active_pins[connection_alias] = pin
        return pin

    try:
        url = f"http://127.0.0.1:{port}/request_pin"
        data = json.dumps({"sql": sql}).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            result = json.loads(response.read().decode("utf-8"))
            pin = str(result.get("pin", ""))
            if not pin:
                raise ValueError("Extension failed to return a PIN.")
            _active_pins[connection_alias] = pin
            return pin
    except Exception as e:
        raise RuntimeError(
            f"Failed to communicate with VS Code Extension bridge: {e}. "
            "Write operation blocked for security."
        )


def verify_security_pin(connection_alias: str, pin: str | None) -> bool:
    """Verify and consume the one-time security PIN."""
    expected_pin = _active_pins.pop(connection_alias, None)
    if not expected_pin:
        return False
    return (pin is not None) and (str(pin).strip() == expected_pin)


def _is_bare_select_star(sql: str) -> str | None:
    """
    Detect a bare SELECT * FROM <table> (no WHERE clause).
    Returns the table name if matched, otherwise None.
    Intent-based interception: redirect to profile_table instead.
    """
    stripped = sql.strip().rstrip(";").strip()
    pattern = re.compile(
        r"^\s*SELECT\s+\*\s+FROM\s+([`\"\w]+)\s*$",
        re.IGNORECASE,
    )
    m = pattern.match(stripped)
    if m:
        return m.group(1).strip('`"')
    return None


async def preview_query(connection: str, sql: str) -> str:
    """
    Dry-run a query through the full safety + intent pipeline.

    Returns:
    - Safety verdict (SAFE / BLOCKED with reason)
    - Intent analysis (interpreted intent, assumed filters, ambiguity warnings)
    - EXPLAIN cost estimate (PostgreSQL only)
    - Final SQL with auto-LIMIT applied

    For bare SELECT * queries on large tables, Bollard will automatically
    redirect to profile_table to give the AI richer context with fewer tokens.

    The editor AI should call this before execute_query for any
    non-trivial query.

    Args:
        connection: Database alias (from connect_database).
        sql: SQL statement to preview.
    """
    session = get_session()
    conn = session.get_connection(connection)
    if not conn:
        return format_error(
            f"No active connection `{connection}`.",
            f"Use `connect_database` to connect first.",
        )

    permission = conn.permission
    adapter = conn.adapter
    settings = get_settings()

    # Intercept bare SELECT * queries on large tables to profile instead
    bare_table = _is_bare_select_star(sql)
    if bare_table and not is_table_forbidden(bare_table, permission.forbidden_tables):
        try:
            limited_sql = inject_limit(sql, permission.max_rows, adapter.dialect)
            explain = await adapter.explain(limited_sql)
            if explain and explain.estimated_rows > _SMART_THRESHOLD:
                from .profiler import profile_table
                profile_output = await profile_table(connection, bare_table)
                return (
                    f"⚡ **Bollard intercepted `SELECT *` and ran a table profile instead.**\n"
                    f"*This saved ~{explain.estimated_rows * 8:,} estimated tokens and gave you richer context.*\n\n"
                    f"---\n\n"
                    + profile_output
                )
        except Exception:
            pass

    validation = validate_query(
        sql=sql,
        mode=permission.mode,
        forbidden_tables=permission.forbidden_tables,
        dialect=adapter.dialect,
    )

    if not validation.is_allowed:
        return format_preview(sql=sql, validation=validation, intent=None, explain=None)

    final_sql = sql
    auto_limit_applied = False
    if validation.operation_type == "SELECT":
        limited = inject_limit(sql, permission.max_rows, adapter.dialect)
        if limited != sql:
            final_sql = limited
            auto_limit_applied = True

    explain = None
    try:
        explain = await adapter.explain(final_sql)
        if explain.estimated_cost > permission.max_query_cost:
            validation.warnings.append(
                f"Estimated query cost ({explain.estimated_cost:,.0f}) exceeds threshold "
                f"({permission.max_query_cost:,.0f}). Consider adding more specific filters."
            )
    except Exception:
        pass

    intent = None
    try:
        schema = session.get_cached_schema(connection)
        if schema:
            intent = analyze_intent(final_sql, schema, adapter.dialect)
    except Exception:
        pass

    return format_preview(
        sql=sql,
        validation=validation,
        intent=intent,
        explain=explain,
        auto_limit_applied=auto_limit_applied,
        final_sql=final_sql,
    )


async def execute_query(
    connection: str,
    sql: str,
    confirmed: bool = False,
    pin: str | None = None,
    confirmation_phrase: str | None = None,
    output_mode: str | None = None,
) -> str:
    """
    Execute a SQL query through the risk-tiered safety pipeline.

    Risk tiers:
      LOW      (SELECT)           → auto-execute, no gate.
      MEDIUM   (write < 5 rows)   → OS PIN required.
      HIGH     (write >= 5 rows)  → OS PIN + type "confirm update N rows".
      CRITICAL (ALTER TABLE)      → OS PIN + review suggested reversal.
      EXTREME  (DROP / TRUNCATE)  → blocked unless mode='admin'.

    Output modes (override connection default):
      'raw'       → Full raw rows always.
      'smart'     → Sample + stats for large results (default).
      'analytics' → Zero rows, stats only.

    Args:
        connection:          Database alias (from connect_database).
        sql:                 SQL statement to execute.
        confirmed:           Required for write operations.
        pin:                 OS PIN for write authorization.
        confirmation_phrase: Required for HIGH risk — typed phrase e.g.
                             "confirm update 12000 rows".
        output_mode:         Override the connection's default output mode.
    """
    session = get_session()
    conn = session.get_connection(connection)
    if not conn:
        return format_error(
            f"No active connection `{connection}`.",
            f"Use `connect_database` to connect first.",
        )

    permission = conn.permission
    adapter = conn.adapter
    operation = detect_operation(sql)

    # Resolve output mode: query override → connection default → global 'smart'
    effective_mode = output_mode or conn.output_mode or "smart"

    validation = validate_query(
        sql=sql,
        mode=permission.mode,
        forbidden_tables=permission.forbidden_tables,
        dialect=adapter.dialect,
    )

    if not validation.is_allowed:
        return format_preview(sql=sql, validation=validation, intent=None, explain=None)

    estimated_rows: int | None = None
    try:
        explain_result = await adapter.explain(sql)
        estimated_rows = explain_result.estimated_rows
    except Exception:
        pass

    risk = score_risk(sql, adapter.dialect, estimated_rows)

    if risk == RiskLevel.EXTREME:
        if permission.mode != "admin":
            return format_error(
                "🔴 EXTREME Risk — Operation Blocked.",
                f"DROP / TRUNCATE operations require `mode='admin'`. "
                f"Reconnect with mode='admin' if this is intentional.\n\n"
                f"**This operation will permanently destroy data and cannot be reversed.**",
            )

    is_write = operation in ("INSERT", "UPDATE", "DELETE", "CREATE", "ALTER", "DROP")
    if is_write:
        port = os.environ.get("BOLLARD_EXTENSION_PORT")
        if not pin:
            try:
                request_extension_pin(connection, sql)
            except Exception as e:
                return format_error("Query execution blocked.", str(e))

            preview = await preview_query(connection, sql)
            local_pin = _active_pins.get(connection, "")

            if risk == RiskLevel.CRITICAL:
                reversal = generate_suggested_reversal(sql, adapter.dialect)
                expected_phrase = "confirm migration"
                _pending_phrases[connection] = expected_phrase
                pin_instruction = (
                    "A PIN has been sent to your VS Code notification."
                    if port else
                    f"A local verification PIN has been generated: **`{local_pin}`**"
                )
                return format_risk_gate(
                    risk_label="CRITICAL",
                    risk_icon="🟠",
                    preview=preview,
                    extra_instruction=(
                        "**Step 1:** Review the Suggested Reversal below.\n"
                        f"**Step 2:** {pin_instruction}.\n"
                        f"**Step 3:** Type exactly: `confirm migration`\n\n"
                        f"Then call:\n"
                        f'```\nexecute_query(connection="{connection}", sql=..., '
                        f'pin="<PIN>", confirmation_phrase="confirm migration")\n```'
                    ),
                    suggested_reversal=reversal,
                )

            elif risk == RiskLevel.HIGH:
                row_label = f"{estimated_rows:,}" if estimated_rows else "many"
                expected_phrase = f"confirm update {row_label} rows"
                _pending_phrases[connection] = expected_phrase
                pin_instruction = (
                    "A PIN has appeared in your VS Code notification."
                    if port else
                    f"A local verification PIN has been generated: **`{local_pin}`**"
                )
                return format_risk_gate(
                    risk_label="HIGH",
                    risk_icon="🟡",
                    preview=preview,
                    extra_instruction=(
                        "This operation affects a **large number of rows**.\n\n"
                        f"**Step 1:** {pin_instruction}.\n"
                        f"**Step 2:** Type exactly: `{expected_phrase}`\n\n"
                        f"Then call:\n"
                        f'```\nexecute_query(connection="{connection}", sql=..., '
                        f'pin="<PIN>", confirmation_phrase="{expected_phrase}")\n```'
                    ),
                )

            else:
                pin_instruction = (
                    "A native VS Code notification has appeared and the PIN has been copied to your clipboard.\n"
                    "Ask the user:\n"
                    "> *\"Please paste the security PIN to authorize this update.\"*\n\n"
                    if port else
                    f"A local verification PIN has been generated: **`{local_pin}`**  \n"
                    "Ask the user to paste this PIN in the chat to confirm the update.\n\n"
                )
                return (
                    preview
                    + "\n\n---\n"
                    + "⚠️ **Write operation requires Human-in-the-loop authorization.**  \n"
                    + pin_instruction
                    + f"Once the user provides it, call `execute_query(connection=..., sql=..., confirmed=True, pin=\"<PIN>\")` to proceed."
                )

        if not verify_security_pin(connection, pin):
            if not port:
                request_extension_pin(connection, sql)
            new_pin = _active_pins.get(connection, "")
            pin_location = (
                "copied to your clipboard" if port else
                f"generated directly in the chat: **`{new_pin}`**"
            )
            return format_error(
                "Query execution blocked: Invalid Security PIN.",
                f"The PIN you entered was incorrect or expired. A new PIN has been {pin_location}. Please paste the new PIN.",
            )

        if risk in (RiskLevel.HIGH, RiskLevel.CRITICAL):
            expected = _pending_phrases.pop(connection, None)
            if not expected:
                return format_error(
                    "Confirmation phrase required.",
                    "Re-run the query without a pin to restart the authorization flow.",
                )
            if not confirmation_phrase or confirmation_phrase.strip().lower() != expected.lower():
                return format_error(
                    "Incorrect confirmation phrase.",
                    f"Expected exactly: `{expected}`\n\nPlease re-enter the exact phrase.",
                )

    final_sql = sql
    if operation == "SELECT":
        final_sql = inject_limit(sql, permission.max_rows, adapter.dialect)

    try:
        result = await adapter.execute(
            sql=final_sql,
            timeout=permission.query_timeout_seconds,
        )
    except Exception as e:
        session.add_query(QueryRecord(
            sql=final_sql,
            connection_alias=connection,
            operation_type=operation,
            row_count=0,
            execution_time_ms=0.0,
            error=str(e),
        ))
        return format_error(f"Query execution failed", str(e))

    session.add_query(QueryRecord(
        sql=final_sql,
        connection_alias=connection,
        operation_type=operation,
        row_count=result.row_count,
        execution_time_ms=result.execution_time_ms,
    ))

    if result.affected_rows is not None:
        return format_query_result(result)

    if effective_mode == "analytics":
        return format_analytics_result(result)

    if effective_mode == "smart" and result.row_count > _SMART_THRESHOLD:
        import csv
        csv_path = None
        try:
            filepath = os.path.join(os.getcwd(), "query_result.csv")
            with open(filepath, "w", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                writer.writerow(result.columns)
                writer.writerows(result.rows)
            csv_path = filepath
        except Exception:
            pass
        return format_smart_result(result, csv_path=csv_path)

    return format_query_result(result)

