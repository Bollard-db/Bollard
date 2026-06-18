from __future__ import annotations

"""
Session state management.

BollardSession is the central state object per workspace.
It holds all active connections, their schema caches,
query history, and user corrections.

State is persisted to ~/.bollard/sessions/{workspace_id}.json
and survives editor restarts.
"""

import json
import time
from dataclasses import dataclass, field, asdict
from datetime import datetime
from pathlib import Path
from typing import Any

from platformdirs import user_data_dir

from ..adapters.base import DatabaseAdapter, SchemaSnapshot
from ..middleware.permissions import ConnectionPermission


# ── State data classes ────────────────────────────────────────────────────

@dataclass
class QueryRecord:
    sql: str
    connection_alias: str
    operation_type: str
    row_count: int
    execution_time_ms: float
    executed_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    error: str | None = None
    intent_confidence: str | None = None   # HIGH / MEDIUM / LOW


@dataclass
class Correction:
    original_query: str
    corrected_query: str
    note: str
    connection_alias: str
    corrected_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class CachedSchema:
    snapshot: SchemaSnapshot
    cached_at: float    # time.monotonic() timestamp
    ttl: int = 300      # seconds


# ── Active connection container ───────────────────────────────────────────

@dataclass
class ActiveConnection:
    alias: str
    connection_string: str      # Stored encrypted; plain only in memory
    adapter: DatabaseAdapter
    permission: ConnectionPermission
    output_mode: str = "smart"  # "raw" | "smart" | "analytics"
    connected_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


# ── Main session object ───────────────────────────────────────────────────

class BollardSession:
    """
    Central per-workspace session. Holds all state that persists
    across individual tool calls.
    """

    def __init__(self, workspace_id: str, history_limit: int = 100) -> None:
        self.workspace_id = workspace_id
        self.history_limit = history_limit

        # Live state (not persisted — reconstructed on restart)
        self._connections: dict[str, ActiveConnection] = {}
        self._schema_cache: dict[str, CachedSchema] = {}

        # Persisted state
        self._query_history: list[QueryRecord] = []
        self._corrections: list[Correction] = []

        self._state_path = self._resolve_state_path()
        self._load()

    # ── Connection management ─────────────────────────────────────────

    def add_connection(self, conn: ActiveConnection) -> None:
        self._connections[conn.alias] = conn

    def get_connection(self, alias: str) -> ActiveConnection | None:
        return self._connections.get(alias)

    def remove_connection(self, alias: str) -> None:
        self._connections.pop(alias, None)
        self._schema_cache.pop(alias, None)

    def list_connections(self) -> list[dict[str, str]]:
        return [
            {
                "alias": c.alias,
                "dialect": c.adapter.dialect,
                "mode": c.permission.mode,
                "output_mode": c.output_mode,
                "connected_at": c.connected_at,
            }
            for c in self._connections.values()
        ]

    # ── Schema cache ──────────────────────────────────────────────────

    def get_cached_schema(self, alias: str) -> SchemaSnapshot | None:
        cached = self._schema_cache.get(alias)
        if cached is None:
            return None
        if time.monotonic() - cached.cached_at > cached.ttl:
            del self._schema_cache[alias]
            return None
        return cached.snapshot

    def set_schema_cache(self, alias: str, snapshot: SchemaSnapshot, ttl: int = 300) -> None:
        self._schema_cache[alias] = CachedSchema(
            snapshot=snapshot,
            cached_at=time.monotonic(),
            ttl=ttl,
        )

    def invalidate_schema(self, alias: str) -> None:
        self._schema_cache.pop(alias, None)

    # ── Query history ─────────────────────────────────────────────────

    def add_query(self, record: QueryRecord) -> None:
        self._query_history.append(record)
        if len(self._query_history) > self.history_limit:
            self._query_history = self._query_history[-self.history_limit:]
        self._save()

    def get_history(self, alias: str, last_n: int = 10) -> list[QueryRecord]:
        filtered = [q for q in self._query_history if q.connection_alias == alias]
        return filtered[-last_n:]

    def history_to_markdown(self, alias: str, last_n: int = 10) -> str:
        records = self.get_history(alias, last_n)
        if not records:
            return "No query history for this connection."
        lines = [f"## Recent Queries — {alias}", ""]
        for i, r in enumerate(reversed(records), 1):
            status = f"✅ {r.row_count} rows" if not r.error else f"❌ {r.error[:60]}"
            lines.append(f"**{i}.** `{r.operation_type}` — {status} ({r.execution_time_ms:.1f}ms)")
            lines.append(f"```sql\n{r.sql[:300]}\n```")
            lines.append("")
        return "\n".join(lines)

    # ── Corrections ───────────────────────────────────────────────────

    def add_correction(self, correction: Correction) -> None:
        self._corrections.append(correction)
        self._save()

    def get_corrections(self, alias: str) -> list[Correction]:
        return [c for c in self._corrections if c.connection_alias == alias]

    def corrections_to_markdown(self, alias: str) -> str:
        corrections = self.get_corrections(alias)
        if not corrections:
            return "No corrections recorded for this connection."
        lines = [f"## User Corrections & Preferences — {alias}", ""]
        for c in corrections:
            lines.append(f"- **Note:** {c.note}")
            if c.corrected_query:
                lines.append(f"  - Corrected query: `{c.corrected_query[:200]}`")
            lines.append("")
        return "\n".join(lines)

    # ── Persistence ───────────────────────────────────────────────────

    def _resolve_state_path(self) -> Path:
        base = Path(user_data_dir("bollard", "bollard")) / "sessions"
        base.mkdir(parents=True, exist_ok=True)
        return base / f"{self.workspace_id}.json"

    def _save(self) -> None:
        try:
            data: dict[str, Any] = {
                "workspace_id": self.workspace_id,
                "query_history": [asdict(q) for q in self._query_history],
                "corrections": [asdict(c) for c in self._corrections],
            }
            self._state_path.write_text(json.dumps(data, indent=2), encoding="utf-8")
        except Exception:
            pass  # Persistence failure is non-fatal

    def _load(self) -> None:
        try:
            if not self._state_path.exists():
                return
            data = json.loads(self._state_path.read_text(encoding="utf-8"))
            self._query_history = [QueryRecord(**q) for q in data.get("query_history", [])]
            self._corrections = [Correction(**c) for c in data.get("corrections", [])]
        except Exception:
            pass  # Load failure is non-fatal — start fresh


# ── Global session registry ───────────────────────────────────────────────

_sessions: dict[str, BollardSession] = {}


def get_session(workspace_id: str = "default", history_limit: int = 100) -> BollardSession:
    if workspace_id not in _sessions:
        _sessions[workspace_id] = BollardSession(workspace_id, history_limit)
    return _sessions[workspace_id]
