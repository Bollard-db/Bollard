# Bollard Database MCP VS Code Extension

Bollard Database MCP is a safe, stateful database access layer designed specifically for AI-powered editors like VS Code and Cursor Copilot.

This extension runs a local database protection server, enabling your AI assistant to safely read schemas, build queries, and run authorized interactions directly inside your editor.

## Key Features

* Safe by Default: Auto-enforces safety profiles like read-only modes, SELECT limitations, and mandatory WHERE clauses.
* Human in the Loop: Any destructive query (INSERT, UPDATE, DELETE, DROP) requires a temporary one-time PIN authorization to prevent accidental executions.
* Semantic Database Intent: Validates queries against safety guidelines before they hit your database.
* System Keyring Support: Saves database credentials securely inside your OS credential manager.

## Prerequisites

Before using this extension, make sure the Bollard MCP Python server is installed:

```bash
pip install bollard-mcp
```

## Settings Configuration

The extension exposes the following configuration settings:

* `bollard.mcpServer.enabled`: Toggle the registration of the Bollard MCP server with VS Code / Cursor (Default: true).
* `bollard.mcpServer.pythonPath`: Path to the Python executable. If left empty, it will auto-detect `.venv/Scripts/python` or `.venv/bin/python` in your workspace.
* `bollard.mcpServer.defaultMaxRows`: Default maximum rows returned by SELECT queries (Default: 1000).
* `bollard.mcpServer.debug`: Enable debug log outputs for troubleshooting (Default: false).

## License

This extension is licensed under the GNU Affero General Public License v3 (AGPL-3.0). For commercial licensing inquiries, please consult the COMMERCIAL_LICENSE file.
