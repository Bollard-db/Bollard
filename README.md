# Bollard MCP 🛡️

An AI-powered, safe database access gateway built on the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/).

Bollard acts as an intelligent execution proxy between your AI code assistant (Cursor, VS Code, Windsurf, Claude Desktop, OpenAI Codex) and your physical databases — providing safe query execution, dynamic schema discovery, cost-based risk parsing, data leak prevention, and session memory.

---

## How It Works

Bollard sits as a transparent intermediary layer between your AI development client and your target database. When the client executes database tools, the requests are statically evaluated, authorized, and structured to optimize context window tokens before the database engine sees them.

### Before Bollard vs. With Bollard

| Workflow Aspect | Before Bollard (Direct SQL Assistant) | With Bollard (Safe Database Gateway) |
| :--- | :--- | :--- |
| **Schema Context** | Relies on manually pasted schema blocks, leading to hallucinated queries on outdated schemas. | Inspects schemas dynamically, caching metadata and profiles to feed the LLM accurate context. |
| **Execution Safety** | AI directly runs generated queries. High risk of accidental data modification, deletion, or drops. | Risk levels (LOW to EXTREME) are computed statically. Destructive operations are safely blocked. |
| **Human-in-the-Loop** | None. Large batch updates or structural migrations execute immediately without warnings. | Write queries require double confirmation (confirming query matching phrases and typing local PINs). |
| **Data Leak Prevention** | AI can query any table, including sensitive tables (e.g., password hashes, user secrets, API keys). | Access control lists block sensitive tables via connection-level blocklist wildcards. |
| **Token & Context Usage** | Large queries return massive raw rows, flooding the context window and wasting thousands of tokens. | Large queries are compressed into structured summaries with a 10-row preview and column stats (up to 97% token savings). |
| **Correction Loop** | No memory of past mistakes. AI repeats the same syntax/query errors in new sessions. | Custom fixes and deprecated field overrides are persisted and auto-injected as agent instructions. |

---

## Getting Started

### 1. Installation

Bollard is written in Python and is available on PyPI:

* **Global Installation (Recommended for CLI / standalone runtimes)**:
  ```bash
  pipx install bollard-mcp
  ```
* **Virtual Environment Installation**:
  ```bash
  pip install bollard-mcp
  ```

---

### 2. Client Configurations

#### Cursor
1. Go to **Cursor Settings** > **Features** > **MCP**.
2. Click **+ Add New MCP Server**.
3. Set the following fields:
   * **Name**: `bollard`
   * **Type**: `command`
   * **Command**: `bollard-mcp` *(or the absolute path to `bollard-mcp` or `python` inside your virtualenv, e.g., `python -m bollard_mcp.server`)*

Or edit your Cursor config file directly (`~/.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "bollard": {
      "command": "bollard-mcp"
    }
  }
}
```

#### VS Code (Cline / Roo Code)
Add the configuration to your Cline settings file (located at `%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json` on Windows):
```json
{
  "mcpServers": {
    "bollard": {
      "command": "bollard-mcp"
    }
  }
}
```

#### Windsurf
Add the configuration under your global Windsurf MCP configuration file (`~/.codeium/windsurf/mcp_config.json`):
```json
{
  "mcpServers": {
    "bollard": {
      "command": "bollard-mcp"
    }
  }
}
```

#### Claude Desktop
Add the configuration to your Claude Desktop config file (`%APPDATA%\Claude\claude_desktop_config.json` on Windows):
```json
{
  "mcpServers": {
    "bollard": {
      "command": "bollard-mcp"
    }
  }
}
```

#### OpenAI Codex
Add the server block under the `[mcp_servers]` table in your Codex configuration file (`~/.codex/config.toml`):
```toml
[mcp_servers.bollard]
command = "python" # or "bollard-mcp" if installed globally via pipx
args = ["-m", "bollard_mcp.server"]
cwd = "/path/to/your/bollard-mcp"
```

> ⚠️ **Write Security Alert for Standalone Clients:**
> Bollard requires a PIN verification loop for write queries (like `INSERT`, `UPDATE`, `DELETE`) that communicates through the companion VS Code/Cursor helper extension. Standalone clients like OpenAI Codex do not run the editor helper backend, so **write operations will be safely blocked** to prevent unauthorized changes. Read-only queries (SELECTs, schema introspection) will work fully.

---

## Database Connection Reference

Once Bollard is registered, prompt your AI agent inside your chat client to connect.

### Connection Prompts
* **General Connect**:
  > *"Connect to my local database with alias `local_postgres` and connection string `postgresql://postgres:postgres@localhost:5432/dbcopilot`"*
* **Connect with a security blocklist**:
  > *"Connect to local database with alias `local_postgres` at `postgresql://postgres:postgres@localhost:5432/dbcopilot` and forbid access to `user_secrets`"*

### Local Docker Testing & Seeding
If you are testing database safety gates locally using a Docker PostgreSQL container:
1. Make sure your local Docker container is running: `docker ps`
2. Seed the database tables (`users`, `orders`, `user_secrets`) by running our seeding script:
   ```bash
   python examples/create_postgres_test_db.py
   ```
3. Prompt the agent in chat to connect and query (e.g. query `user_secrets` to verify the blocklist intercepts the request).

---

## License

Bollard is dual-licensed under:
* **AGPL-3.0-only** for open-source non-commercial use. See [LICENSE](LICENSE) for details.
* **Commercial License** for commercial production use. If you need custom SLAs, Okta/SSO integrations, or compliance audit log exporting, please contact sales at `pavakstudio@gmail.com`.
