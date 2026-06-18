from __future__ import annotations

"""
DB-Native SQL Profiler — profile_table tool

Pushes all aggregation work to the database engine via SQL sub-queries.
No Pandas. No local data loading. No memory spikes.

For each column, generates parallel aggregate queries and returns
a compact Markdown summary (~150 tokens) suitable for AI context.

Cardinality threshold: columns with <= 100 distinct values are
treated as categorical and show a TOP-5 value distribution.
"""

from ..state.session import get_session
from ..formatters.markdown import format_error
from ..safety.validator import is_table_forbidden

# Categorical threshold — columns with distinct count <= this are shown
# with a value distribution table.
_CATEGORICAL_THRESHOLD = 100

# Numeric SQL type keywords
_NUMERIC_TYPES = {
    "int", "integer", "bigint", "smallint", "tinyint",
    "float", "double", "real", "numeric", "decimal", "number",
    "money", "serial", "bigserial",
}

# Datetime SQL type keywords
_DATE_TYPES = {"date", "timestamp", "datetime", "time", "timestamptz"}


def _is_numeric(col_type: str) -> bool:
    t = col_type.lower()
    return any(nt in t for nt in _NUMERIC_TYPES)


def _is_date(col_type: str) -> bool:
    t = col_type.lower()
    return any(dt in t for dt in _DATE_TYPES)


def _build_column_profile_sql(table: str, col_name: str, col_type: str, dialect: str) -> str:
    """
    Build a single SQL query that returns all stats for one column.
    Uses sub-selects inside a single query to minimize round trips.
    """
    q = f'"{col_name}"' if dialect not in ("mysql", "sqlite") else f'`{col_name}`'
    t = f'"{table}"' if dialect not in ("mysql", "sqlite") else f'`{table}`'

    if dialect == "sqlite":
        # SQLite: no FILTER clause, use CASE
        null_pct = (
            f"ROUND(100.0 * SUM(CASE WHEN {q} IS NULL THEN 1 ELSE 0 END) / COUNT(*), 2)"
        )
    else:
        null_pct = f"ROUND(100.0 * COUNT(*) FILTER (WHERE {q} IS NULL) / NULLIF(COUNT(*), 0), 2)"

    parts = [
        f"SELECT",
        f"  COUNT(*) AS total_rows,",
        f"  COUNT({q}) AS non_null_count,",
        f"  {null_pct} AS null_pct,",
        f"  COUNT(DISTINCT {q}) AS distinct_count",
    ]

    if _is_numeric(col_type):
        parts.append(f"  , MIN({q}) AS min_val")
        parts.append(f"  , MAX({q}) AS max_val")
        if dialect == "sqlite":
            parts.append(f"  , ROUND(AVG(CAST({q} AS REAL)), 4) AS avg_val")
        else:
            parts.append(f"  , ROUND(AVG({q}::NUMERIC), 4) AS avg_val")
    elif _is_date(col_type):
        parts.append(f"  , CAST(MIN({q}) AS TEXT) AS min_val")
        parts.append(f"  , CAST(MAX({q}) AS TEXT) AS max_val")
        parts.append(f"  , NULL AS avg_val")
    else:
        parts.append(f"  , NULL AS min_val")
        parts.append(f"  , NULL AS max_val")
        parts.append(f"  , NULL AS avg_val")

    parts.append(f"FROM {t}")
    return "\n".join(parts)


def _build_distribution_sql(table: str, col_name: str, dialect: str) -> str:
    """
    Build SQL to get TOP-5 value distribution for categorical columns.
    """
    q = f'"{col_name}"' if dialect not in ("mysql", "sqlite") else f'`{col_name}`'
    t = f'"{table}"' if dialect not in ("mysql", "sqlite") else f'`{table}`'
    return (
        f"SELECT CAST({q} AS TEXT) AS value, COUNT(*) AS cnt\n"
        f"FROM {t}\n"
        f"GROUP BY {q}\n"
        f"ORDER BY cnt DESC\n"
        f"LIMIT 5"
    )


def _format_profile_markdown(
    table: str,
    column_profiles: list[dict],
    total_rows: int,
) -> str:
    """Format column profile data as compact Markdown for AI context."""
    lines = [
        f"## Table Profile: `{table}`",
        f"",
        f"**Total rows:** {total_rows:,}",
        f"",
        f"### Column Statistics",
        f"",
        f"| Column | Type | Null% | Distinct | Min | Max | Avg |",
        f"| --- | --- | --- | --- | --- | --- | --- |",
    ]

    distribution_sections: list[str] = []

    for col in column_profiles:
        name = col["name"]
        ctype = col["type"]
        null_pct = col.get("null_pct", "?")
        distinct = col.get("distinct_count", "?")
        min_val = col.get("min_val", "—")
        max_val = col.get("max_val", "—")
        avg_val = col.get("avg_val", "—")

        # Truncate long values
        def _trunc(v: object, n: int = 20) -> str:
            s = str(v) if v is not None else "—"
            return s[:n] + "…" if len(s) > n else s

        lines.append(
            f"| `{name}` | {ctype} | {null_pct}% | {distinct:,} | "
            f"{_trunc(min_val)} | {_trunc(max_val)} | {_trunc(avg_val)} |"
            if isinstance(distinct, int) else
            f"| `{name}` | {ctype} | {null_pct}% | {distinct} | "
            f"{_trunc(min_val)} | {_trunc(max_val)} | {_trunc(avg_val)} |"
        )

        # Categorical distribution
        dist = col.get("distribution")
        if dist:
            distribution_sections.append(
                f"\n**`{name}`** — Top values:\n\n"
                + "| Value | Count |\n| --- | --- |\n"
                + "\n".join(f"| {_trunc(r[0], 30)} | {r[1]:,} |" for r in dist)
            )

    if distribution_sections:
        lines += ["", "### Value Distributions (Categorical Columns)", ""]
        lines += distribution_sections

    lines += [
        "",
        f"*Profile generated by Bollard. Zero rows transferred to AI context.*",
    ]
    return "\n".join(lines)


async def profile_table(connection: str, table_name: str) -> str:
    """
    Generate a statistical profile of a database table.

    All aggregation is performed directly in the database via SQL queries.
    No rows are transferred to local memory. Returns a compact Markdown
    summary suitable for AI context (< 150 tokens overhead per column).

    Includes for every column:
    - Row count and null percentage
    - Distinct value count
    - Min / Max / Avg (numeric and date columns)
    - Top-5 value distribution for categorical columns (<= 100 distinct values)

    Args:
        connection: Database alias (from connect_database).
        table_name: Name of the table to profile.
    """
    session = get_session()
    conn = session.get_connection(connection)
    if not conn:
        return format_error(
            f"No active connection `{connection}`.",
            "Use `connect_database` to connect first.",
        )

    if is_table_forbidden(table_name, conn.permission.forbidden_tables):
        return format_error(
            f"Access to table `{table_name}` is forbidden by connection policy."
        )

    adapter = conn.adapter
    dialect = adapter.dialect

    # Get schema to know column names and types
    schema = session.get_cached_schema(connection)
    if not schema:
        try:
            schema = await adapter.get_schema()
            from ..config import get_settings
            session.set_schema_cache(connection, schema, ttl=get_settings().schema_cache_ttl)
        except Exception as e:
            return format_error(f"Failed to load schema for `{connection}`", str(e))

    # Find the table in schema
    table_info = None
    for t in schema.tables:
        if t.name.lower() == table_name.lower():
            table_info = t
            break

    if not table_info:
        available = ", ".join(f"`{t.name}`" for t in schema.tables[:20])
        return format_error(
            f"Table `{table_name}` not found in `{connection}`.",
            f"Available tables: {available}",
        )

    columns = table_info.columns
    if not columns:
        return format_error(f"Table `{table_name}` has no columns in the schema cache.")

    column_profiles: list[dict] = []
    total_rows = 0

    for col in columns:
        col_name = col.name
        col_type = str(col.data_type)

        # Run the per-column aggregate query
        profile_sql = _build_column_profile_sql(table_name, col_name, col_type, dialect)
        try:
            result = await adapter.execute(profile_sql)
            if result.rows:
                row = result.rows[0]
                # Map positional results
                # total_rows, non_null_count, null_pct, distinct_count, min_val, max_val, avg_val
                total_rows = int(row[0]) if row[0] is not None else 0
                null_pct = float(row[2]) if row[2] is not None else 0.0
                distinct_count = int(row[3]) if row[3] is not None else 0
                min_val = row[4] if len(row) > 4 else None
                max_val = row[5] if len(row) > 5 else None
                avg_val = row[6] if len(row) > 6 else None

                profile: dict = {
                    "name": col_name,
                    "type": col_type,
                    "null_pct": null_pct,
                    "distinct_count": distinct_count,
                    "min_val": min_val,
                    "max_val": max_val,
                    "avg_val": avg_val,
                }

                # Get value distribution for categorical columns
                if 0 < distinct_count <= _CATEGORICAL_THRESHOLD:
                    try:
                        dist_sql = _build_distribution_sql(table_name, col_name, dialect)
                        dist_result = await adapter.execute(dist_sql)
                        if dist_result.rows:
                            profile["distribution"] = dist_result.rows
                    except Exception:
                        pass  # Distribution is best-effort

                column_profiles.append(profile)
        except Exception:
            # If a column fails, record it as unknown rather than failing the whole profile
            column_profiles.append({
                "name": col_name,
                "type": col_type,
                "null_pct": "?",
                "distinct_count": "?",
            })

    if not column_profiles:
        return format_error(f"Could not profile any columns in `{table_name}`.")

    return _format_profile_markdown(table_name, column_profiles, total_rows)
