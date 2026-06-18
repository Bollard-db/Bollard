# Bollard MCP

An AI-powered, safe database access layer built on the [Model Context Protocol](https://modelcontextprotocol.io/).

Bollard acts as an intelligent execution layer between AI code editors (Cursor, VS Code, Claude Desktop) and your databases — providing safe query execution, schema discovery, semantic intent validation, and persistent session memory.

## Quick Start

```bash
pip install bollard-mcp
```

Add to `.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "bollard": {
      "command": "bollard-mcp"
    }
  }
}
```

Then in Cursor chat:
```
Connect to my database: postgresql://user:pass@localhost/mydb
Show me all tables
Find users who signed up last week but haven't placed an order
```

## Supported Databases

- **PostgreSQL** (primary)
- **MySQL / MariaDB**
- **SQLite**
- **MS SQL Server**
- **Oracle**
- **MongoDB** (Phase 2)

## Key Features

- **Safe by default** — read-only mode, auto-LIMIT, WHERE enforcement, destructive operation blocking
- **Intent validation** — detects soft-delete blind spots, status ambiguity, missing tenant scope
- **Session memory** — schema cache, query history, user corrections persisted across restarts
- **OS Keyring** — credentials stored in system native vault (macOS Keychain, Windows Credential Manager, Linux Secret Service)
- **No built-in LLM** — editor AI handles reasoning; Bollard handles safe execution

## Documentation

See [docs/](docs/) for setup guides, permission profiles, and safety configuration.
