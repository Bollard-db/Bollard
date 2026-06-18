from __future__ import annotations

"""
Result Formatter — Markdown output for MCP tool responses.

All tool responses are formatted as clean markdown so the
editor AI and the user both get readable, structured output.
"""

from typing import Any

from ..adapters.base import QueryResult, ExplainResult
from ..safety.validator import ValidationResult
from ..safety.intent_validator import IntentAnalysis


def format_query_result(result: QueryResult, max_rows_shown: int = 100) -> str:
    """
    Format a QueryResult as a markdown table.

    For SELECT results: renders a column-aligned markdown table.
    For DML results: returns affected row count summary.
    """
    if result.affected_rows is not None:

        return (
            f"✅ **{result.affected_rows} row(s) affected**  \n"
            f"⏱ Execution time: {result.execution_time_ms:.1f}ms"
        )

    if not result.columns:
        return "✅ Query executed. No rows returned."

    if result.row_count == 0:
        col_list = ", ".join(f"`{c}`" for c in result.columns)
        return f"✅ Query returned **0 rows**.  \nColumns: {col_list}"


    rows_to_show = result.rows[:max_rows_shown]
    lines: list[str] = []

    lines.append("| " + " | ".join(str(c) for c in result.columns) + " |")
    lines.append("| " + " | ".join("---" for _ in result.columns) + " |")

    for row in rows_to_show:
        cells = []
        for cell in row:
            if cell is None:
                cells.append("*null*")
            else:
                val = str(cell).replace("|", "\\|").replace("\n", " ")
                if len(val) > 100:
                    val = val[:97] + "..."
                cells.append(val)
        lines.append("| " + " | ".join(cells) + " |")

    table = "\n".join(lines)
    truncation_note = ""
    if result.row_count > max_rows_shown:
        truncation_note = (
            f"\n\n*Showing {max_rows_shown} of {result.row_count} rows. "
            f"Refine your query or increase LIMIT to see more.*"
        )

    return (
        f"✅ **{result.row_count} row(s)** returned in {result.execution_time_ms:.1f}ms\n\n"
        f"{table}{truncation_note}"
    )


def format_preview(
    sql: str,
    validation: ValidationResult,
    intent: IntentAnalysis | None,
    explain: ExplainResult | None,
    auto_limit_applied: bool = False,
    final_sql: str | None = None,
) -> str:
    """
    Format the full preview_query response.

    Combines: safety verdict + intent analysis + EXPLAIN cost + final SQL.
    """
    lines: list[str] = []


    if not validation.is_allowed:
        lines += [
            "## ❌ Query Blocked",
            "",
            f"**Reason:** {validation.blocked_reason}",
            "",
        ]
        if validation.safe_alternative:
            lines += [
                "**Suggested fix:**",
                f"```sql\n{validation.safe_alternative}\n```",
            ]
        return "\n".join(lines)


    safety_icon = "✅"
    lines += [
        "## Query Preview",
        "",
        f"**Operation:** `{validation.operation_type}`  ",
        f"**Tables:** {', '.join(f'`{t}`' for t in validation.tables_accessed) or 'N/A'}  ",
    ]

    if explain:
        lines += [
            f"**Estimated cost:** {explain.estimated_cost:,.1f}  ",
            f"**Estimated rows:** {explain.estimated_rows:,}  ",
        ]

    if validation.warnings:
        for w in validation.warnings:
            lines.append(f"⚠️ {w}  ")

    lines += [f"**Safety:** {safety_icon} SAFE", ""]


    if intent and (intent.ambiguity_warnings or intent.confidence != "HIGH"):
        confidence_icon = {"HIGH": "🟢", "MEDIUM": "🟡", "LOW": "🔴"}.get(intent.confidence, "⚪")
        lines += [
            "---",
            "",
            "## ⚠️ Intent Analysis",
            "",
            f"**Interpreted as:** {intent.interpreted_intent}  ",
        ]
        if intent.assumed_filters:
            lines.append(f"**Assumed filters:** {', '.join(intent.assumed_filters)}  ")
        if intent.ambiguity_warnings:
            lines.append("")
            lines.append("**Ambiguity Warnings:**")
            for w in intent.ambiguity_warnings:
                lines.append(f"- ⚠️ {w}")
        lines += [
            "",
            f"**Confidence:** {confidence_icon} {intent.confidence}",
            "",
        ]


    display_sql = final_sql or sql
    lines += ["---", ""]
    if auto_limit_applied:
        lines.append("*LIMIT auto-applied by Bollard policy.*  ")
    lines += [
        f"```sql\n{display_sql}\n```",
        "",
        "*Call `execute_query` to run this query.*",
    ]

    return "\n".join(lines)


def format_schema(alias: str, markdown: str) -> str:
    return f"## Schema: {alias}\n\n{markdown}"


def format_error(message: str, detail: str | None = None) -> str:
    lines = [f"❌ **Error:** {message}"]
    if detail:
        lines += ["", f"```\n{detail}\n```"]
    return "\n".join(lines)


def format_connection_list(connections: list[dict[str, str]]) -> str:
    if not connections:
        return "No active database connections.\n\nUse `connect_database` to connect."
    lines = ["## Active Connections", ""]
    for c in connections:
        lines.append(
            f"- **{c['alias']}** — {c['dialect']} | mode: `{c['mode']}` "
            f"| output: `{c.get('output_mode', 'smart')}` | connected: {c['connected_at']}"
        )
    return "\n".join(lines)


def format_smart_result(result: Any, sample_size: int = 10, csv_path: str | None = None) -> str:
    """
    Smart-mode output: human sees full count, AI gets a 10-row sample + column note.

    Triggered when query returns more rows than the smart threshold.
    Keeps AI context lean while preserving full information for the developer.
    """
    total = result.row_count
    sample_rows = result.rows[:sample_size]
    columns = result.columns

    dest_note = "available in your editor"
    if csv_path:
        formatted_path = csv_path.replace("\\", "/")
        dest_note = f"written to [query_result.csv](file:///{formatted_path})"

    lines: list[str] = [
        f"⚡ **Smart Mode** — {total:,} rows found. Showing {min(sample_size, total)} sample rows to AI.",
        f"*({dest_note.capitalize()}. The AI receives only this summary.)*",
        "",
        "### Sample Data",
        "",
    ]

    lines.append("| " + " | ".join(str(c) for c in columns) + " |")
    lines.append("| " + " | ".join("---" for _ in columns) + " |")

    for row in sample_rows:
        cells = []
        for cell in row:
            if cell is None:
                cells.append("*null*")
            else:
                val = str(cell).replace("|", "\\|").replace("\n", " ")
                if len(val) > 80:
                    val = val[:77] + "..."
                cells.append(val)
        lines.append("| " + " | ".join(cells) + " |")

    lines += [
        "",
        f"*Call `profile_table` for full column statistics on this result set.*",
        f"*Token savings: ~{max(0, total - sample_size) * len(columns) * 8:,} estimated tokens saved.*",
    ]
    return "\n".join(lines)


def format_analytics_result(result: Any) -> str:
    """
    Analytics mode: return only column-level stats, zero rows to AI.
    The result must have been pre-profiled before calling this.
    """
    total = result.row_count
    columns = result.columns
    lines = [
        f"📊 **Analytics Mode** — {total:,} rows in result set.",
        f"*(Zero rows transferred to AI context. Use `profile_table` for full statistics.)*",
        "",
        f"**Columns returned:** {', '.join(f'`{c}`' for c in columns)}",
        "",
        f"*Run `profile_table` on the source table for MIN/MAX/NULL%/distribution statistics.*",
    ]
    return "\n".join(lines)


def format_risk_gate(
    risk_label: str,
    risk_icon: str,
    preview: str,
    extra_instruction: str,
    suggested_reversal: str | None = None,
) -> str:
    """
    Format the risk-level confirmation gate message shown to the user before
    a write operation is authorized.
    """
    lines = [
        preview,
        "",
        "---",
        "",
        f"## {risk_icon} {risk_label} Operation — Authorization Required",
        "",
        extra_instruction,
    ]
    if suggested_reversal:
        lines += [
            "",
            "### Suggested Reversal",
            "",
            "> ⚠️ **This is NOT a true rollback.** It recreates the schema structure only.",
            "> Lost data **cannot be recovered** without a database backup or snapshot.",
            "",
            f"```sql\n{suggested_reversal}\n```",
        ]
    return "\n".join(lines)
