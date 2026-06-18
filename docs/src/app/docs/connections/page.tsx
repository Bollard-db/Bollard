import React from "react";

export default function ConnectionsDocsPage() {
  return (
    <main className="content-body">
      <h1 id="setup-and-connections">Setup & Connections</h1>
      <p>
        Getting Bollard connected to your database is simple. It runs as a standard Model Context Protocol (MCP) server over standard input/output streams, meaning any modern editor client (such as Cursor or VS Code) can manage the server daemon process directly.
      </p>

      <h2 id="installation">1. Installation</h2>
      <p>
        Bollard is packaged as a standard Python module available on PyPI. You can install it globally, in a project virtual environment, or run it directly from source.
      </p>

      <h3>Global Installation (Recommended)</h3>
      <p>
        Install the package globally using <code>pip</code>. This automatically registers the <code>bollard-mcp</code> CLI executable in your system path:
      </p>
      <pre>
        <code>
          {`pip install bollard-mcp`}
        </code>
      </pre>

      <h3>Virtual Environment Installation</h3>
      <p>
        If you prefer to lock dependencies per project or keep your system scope clean, install it in a local Python virtual environment:
      </p>
      <pre>
        <code>
{`# Create virtual environment and activate
python -m venv .venv

# Activate on macOS/Linux
source .venv/bin/activate

# Activate on Windows (PowerShell)
.venv\\Scripts\\activate

# Install the package
pip install bollard-mcp`}
        </code>
      </pre>

      <h3>Developer Source Installation</h3>
      <p>
        To run the latest bleeding-edge updates directly from the source repository:
      </p>
      <pre>
        <code>
{`git clone https://github.com/Bollard-db/Bollard.git
cd Bollard
python -m venv .venv
source .venv/bin/activate # or .venv\\Scripts\\activate on Windows
pip install -e .`}
        </code>
      </pre>

      <h2 id="configuring-the-editor">2. Configuring your IDE Client</h2>
      <p>
        Because Bollard implements the standard Model Context Protocol (MCP), it integrates out-of-the-box with any modern IDE client that supports MCP servers.
      </p>

      <h3>Cursor</h3>
      <p>
        To configure Bollard in <strong>Cursor</strong>:
      </p>
      <ol>
        <li>Navigate to <strong>Cursor Settings</strong> &gt; <strong>Features</strong> &gt; <strong>MCP</strong>.</li>
        <li>Click <strong>+ Add New MCP Server</strong>.</li>
        <li>Configure the server with the following settings:
          <ul>
            <li><strong>Name</strong>: <code>bollard</code></li>
            <li><strong>Type</strong>: <code>command</code></li>
            <li><strong>Command</strong>: <code>bollard-mcp</code> <em>(or the full absolute path to the executable inside your virtualenv)</em></li>
          </ul>
        </li>
      </ol>
      <p>
        Alternatively, you can edit your Cursor MCP config file directly:
      </p>
      <ul>
        <li><strong>Windows</strong>: <code>%USERPROFILE%\.cursor\mcp.json</code></li>
        <li><strong>macOS/Linux</strong>: <code>~/.cursor/mcp.json</code></li>
      </ul>
      <pre>
        <code>
          {`{
  "mcpServers": {
    "bollard": {
      "command": "bollard-mcp",
      "env": {
        "BOLLARD_DEBUG": "false"
      }
    }
  }
}`}
        </code>
      </pre>

      {/* Editor / MCP Settings Mockup */}
      <div className="editor-mockup">
        <div className="editor-titlebar">
          <span className="em-dot r"/><span className="em-dot a"/><span className="em-dot g"/>
          <span className="em-title">Cursor — MCP Server Settings</span>
        </div>
        <div className="editor-body">
          <div className="editor-sidebar">
            <div className="em-section">MCP Servers</div>
            <div className="em-item active">
              <span className="em-dot-s on"/>bollard
            </div>
            <div className="em-item">
              <span className="em-dot-s off"/>github
            </div>
            <div className="em-item">
              <span className="em-dot-s off"/>filesystem
            </div>
          </div>
          <div className="editor-main">
            <pre><code>
              <span className="em-p">{"{"}  </span><br/>
              &nbsp;&nbsp;<span className="em-k">&quot;mcpServers&quot;</span><span className="em-p">: {"{"}  </span><br/>
              &nbsp;&nbsp;&nbsp;&nbsp;<span className="em-k">&quot;bollard&quot;</span><span className="em-p">: {"{"}  </span><br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="em-k">&quot;command&quot;</span><span className="em-p">: </span><span className="em-s">&quot;bollard-mcp&quot;</span><span className="em-p">,</span><br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="em-k">&quot;env&quot;</span><span className="em-p">: {"{"}</span><br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="em-k">&quot;BOLLARD_DEBUG&quot;</span><span className="em-p">: </span><span className="em-s">&quot;false&quot;</span><br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="em-p">{"}"}</span><br/>
              &nbsp;&nbsp;&nbsp;&nbsp;<span className="em-p">{"}"}  </span><br/>
              &nbsp;&nbsp;<span className="em-p">{"}"}  </span><br/>
              <span className="em-p">{"}"}  </span>
            </code></pre>
          </div>
        </div>
        <div className="editor-statusbar">
          <span className="em-ok">●</span>
          <span className="em-name">bollard</span>
          <span className="em-cyan">14 tools available</span>
          <span>• Connected</span>
        </div>
      </div>

      <h3 id="github-copilot">GitHub Copilot (VS Code)</h3>
      <p>
        To configure Bollard with <strong>GitHub Copilot Chat</strong> in VS Code, you can set up the <code>mcp.json</code> file structure either globally or locally for your workspace. Note that Copilot expects the top-level key to be <code>"servers"</code> instead of <code>"mcpServers"</code>.
      </p>

      <h4>Option A: Global User Setup (All projects)</h4>
      <ol>
        <li>Open the VS Code Command Palette (<code>Ctrl+Shift+P</code> or <code>Cmd+Shift+P</code>).</li>
        <li>Search for and select <strong>MCP: Open User Configuration</strong>.</li>
        <li>If the configuration file is empty, paste the full JSON below. If you already have other servers configured, add the <code>"bollard"</code> block inside your existing <code>"servers"</code> object:</li>
      </ol>
      <pre>
        <code>
          {`{
  "servers": {
    "bollard": {
      "command": "bollard-mcp",
      "env": {
        "BOLLARD_DEBUG": "false"
      }
    }
  }
}`}
        </code>
      </pre>

      <h4>Option B: Local Workspace Setup (This project only)</h4>
      <ol>
        <li>Create a folder named <code>.vscode</code> at the root of your project workspace.</li>
        <li>Create a file named <code>mcp.json</code> inside it (i.e. <code>.vscode/mcp.json</code>).</li>
        <li>If this is a new configuration file, paste the full JSON below. If you already have other servers configured, add the <code>"bollard"</code> block inside your existing <code>"servers"</code> object:</li>
      </ol>
      <pre>
        <code>
          {`{
  "servers": {
    "bollard": {
      "command": "bollard-mcp",
      "env": {
        "BOLLARD_DEBUG": "false"
      }
    }
  }
}`}
        </code>
      </pre>

      <h3>VS Code (with Cline / Roo Code / Claude Dev)</h3>
      <p>
        To use Bollard with Claude/Roo agents in <strong>VS Code</strong> using the <strong>Cline</strong> extension:
      </p>
      <ol>
        <li>Click the Cline tab in the sidebar.</li>
        <li>Click the gear icon (Settings) in the top-right corner.</li>
        <li>Scroll down to the <strong>MCP Settings</strong> section and click <strong>Edit MCP Settings</strong>.</li>
        <li>Add the server configuration to the JSON file:</li>
      </ol>
      <p>
        The configuration file is located at:
      </p>
      <ul>
        <li><strong>Windows</strong>: <code>%APPDATA%\\Code\\User\\globalStorage\\saoudrizwan.claude-dev\\settings\\cline_mcp_settings.json</code></li>
        <li><strong>macOS</strong>: <code>~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json</code></li>
      </ul>
      <pre>
        <code>
          {`{
  "mcpServers": {
    "bollard": {
      "command": "bollard-mcp",
      "env": {
        "BOLLARD_DEBUG": "false"
      }
    }
  }
}`}
        </code>
      </pre>

      <h3>Windsurf</h3>
      <p>
        To use Bollard inside <strong>Windsurf</strong>:
      </p>
      <p>
        Add the configuration under your global Windsurf MCP configuration file located at:
      </p>
      <ul>
        <li><strong>Windows</strong>: <code>%USERPROFILE%\\.codeium\\windsurf\\mcp_config.json</code></li>
        <li><strong>macOS/Linux</strong>: <code>~/.codeium/windsurf/mcp_config.json</code></li>
      </ul>
      <pre>
        <code>
          {`{
  "mcpServers": {
    "bollard": {
      "command": "bollard-mcp",
      "env": {
        "BOLLARD_DEBUG": "false"
      }
    }
  }
}`}
        </code>
      </pre>

      <h3>Claude Desktop Client</h3>
      <p>
        To configure Bollard with the official <strong>Claude Desktop</strong> app:
      </p>
      <p>
        Edit your Claude Desktop configuration file located at:
      </p>
      <ul>
        <li><strong>Windows</strong>: <code>%APPDATA%\\Claude\\claude_desktop_config.json</code></li>
        <li><strong>macOS</strong>: <code>~/Library/Application Support/Claude/claude_desktop_config.json</code></li>
      </ul>
      <pre>
        <code>
          {`{
  "mcpServers": {
    "bollard": {
      "command": "bollard-mcp",
      "env": {
        "BOLLARD_DEBUG": "false"
      }
    }
  }
}`}
        </code>
      </pre>

      <div className="callout danger">
        <div className="callout-title">Troubleshooting: Connection state: Error spawn bollard-mcp ENOENT</div>
        <p>
          If you check your IDE's MCP logs and see a <code>Connection state: Error spawn bollard-mcp ENOENT</code> error, it means your editor cannot find the <code>bollard-mcp</code> executable in your system's PATH.
        </p>
        <p style={{ marginTop: "10px" }}>
          <strong>How to fix:</strong>
        </p>
        <ol style={{ marginTop: "5px", marginBottom: "5px" }}>
          <li>Open your terminal and run <code>where bollard-mcp</code> (on Windows) or <code>which bollard-mcp</code> (on macOS/Linux).</li>
          <li>Copy the returned absolute path to the executable.</li>
          <li>Replace <code>"command": "bollard-mcp"</code> with the full path in your configuration JSON (for example, <code>"C:\\\\Users\\\\username\\\\AppData\\\\Local\\\\Programs\\\\Python\\\\Python310\\\\Scripts\\\\bollard-mcp.exe"</code> on Windows, or <code>"/home/username/.local/bin/bollard-mcp"</code> on Linux).</li>
        </ol>
      </div>

      <h3 id="openai-codex">OpenAI Codex</h3>
      <p>
        To configure Bollard with <strong>OpenAI Codex</strong>, you can add the server under the <code>[mcp_servers]</code> table in your Codex configuration file:
      </p>
      <ul>
        <li><strong>Windows</strong>: <code>%USERPROFILE%\.codex\config.toml</code></li>
        <li><strong>macOS/Linux</strong>: <code>~/.codex/config.toml</code></li>
      </ul>
      <pre>
        <code>
          {`[mcp_servers.bollard]
command = "python" # or "bollard-mcp" if installed globally via pipx
args = ["-m", "bollard_mcp.server"]
cwd = "/path/to/bollard-mcp" # optional: set workspace directory`}
        </code>
      </pre>
      <div className="callout warning">
        <div className="callout-title">Write Operations In Standalone Clients</div>
        <p>
          In standalone clients (like OpenAI Codex or Claude Desktop) that do not run the editor helper extension, Bollard automatically falls back to an <strong>In-Chat PIN Gate</strong>. When the AI attempts a write query, the server will block execution, generate a local 4-digit verification PIN, and print it directly in the chat. You simply need to copy-paste this PIN back into the chat prompt to authorize and run the write query safely.
        </p>
      </div>

      <h3>Cross-Platform OS Binary Path Resolution</h3>
      <p>
        If your IDE cannot find the <code>bollard-mcp</code> command globally, replace <code>"command": "bollard-mcp"</code> with the full absolute path where Python installed the binary:
      </p>
      <ul>
        <li><strong>Windows (Global Pip)</strong>: <code>"C:\\\\Users\\\\YourUsername\\\\AppData\\\\Local\\\\Programs\\\\Python\\\\Python310\\\\Scripts\\\\bollard-mcp.exe"</code></li>
        <li><strong>macOS/Linux (Global Pip)</strong>: <code>"/usr/local/bin/bollard-mcp"</code> or <code>"/Users/YourUsername/.local/bin/bollard-mcp"</code></li>
        <li><strong>Virtual Environment</strong>: <code>"/path/to/your/project/.venv/bin/bollard-mcp"</code> (macOS/Linux) or <code>"C:\\\\path\\\\to\\\\your\\\\project\\\\.venv\\\\Scripts\\\\bollard-mcp.exe"</code> (Windows)</li>
      </ul>


      <h2 id="environment-variables">3. Environment Variables</h2>
      <p>
        You can fine-tune Bollard using the following environment variables. Place them in your editor's MCP configuration settings or in a <code>.env</code> file in the server's working directory.
      </p>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Variable</th>
              <th>Type</th>
              <th>Default</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>BOLLARD_SERVER_NAME</code></td>
              <td>string</td>
              <td><code>"Bollard Database MCP"</code></td>
              <td>Server identifier displayed in your editor client.</td>
            </tr>
            <tr>
              <td><code>BOLLARD_DEBUG</code></td>
              <td>boolean</td>
              <td><code>false</code></td>
              <td>Enables verbose logging to standard error for debugging.</td>
            </tr>
            <tr>
              <td><code>BOLLARD_DEFAULT_MAX_ROWS</code></td>
              <td>integer</td>
              <td><code>1000</code></td>
              <td>Hard limit applied to query result rows to protect context window tokens.</td>
            </tr>
            <tr>
              <td><code>BOLLARD_DEFAULT_QUERY_TIMEOUT</code></td>
              <td>integer</td>
              <td><code>30</code></td>
              <td>Max running time in seconds before a query is aborted.</td>
            </tr>
            <tr>
              <td><code>BOLLARD_DEFAULT_MAX_COST</code></td>
              <td>float</td>
              <td><code>100000.0</code></td>
              <td>Cost warning threshold. Evaluates estimated cost via EXPLAIN plans.</td>
            </tr>
            <tr>
              <td><code>BOLLARD_SESSION_HISTORY_LIMIT</code></td>
              <td>integer</td>
              <td><code>100</code></td>
              <td>Max number of execution logs kept in the query history buffer.</td>
            </tr>
            <tr>
              <td><code>BOLLARD_SCHEMA_CACHE_TTL</code></td>
              <td>integer</td>
              <td><code>300</code></td>
              <td>Lifespan in seconds for caching DB schema blueprints (5 minutes).</td>
            </tr>
            <tr>
              <td><code>BOLLARD_CREDENTIAL_BACKEND</code></td>
              <td>string</td>
              <td><code>"auto"</code></td>
              <td>Backend for credential store. Options: <code>auto</code>, <code>keyring</code>, <code>encrypted</code>.</td>
            </tr>
            <tr>
              <td><code>BOLLARD_ENCRYPTION_KEY</code></td>
              <td>string</td>
              <td><code>null</code></td>
              <td>Base64 Fernet key used to encrypt the credentials fallback file.</td>
            </tr>
            <tr>
              <td><code>BOLLARD_AI_ENABLED</code></td>
              <td>boolean</td>
              <td><code>false</code></td>
              <td>Enables the internal AI query optimization advisor modules.</td>
            </tr>
            <tr>
              <td><code>BOLLARD_AI_PROVIDER</code></td>
              <td>string</td>
              <td><code>"anthropic"</code></td>
              <td>AI provider endpoint target. Options: <code>anthropic</code>, <code>nvidia_nim</code>.</td>
            </tr>
            <tr>
              <td><code>BOLLARD_ANTHROPIC_API_KEY</code></td>
              <td>string</td>
              <td><code>null</code></td>
              <td>Anthropic Developer API key credential.</td>
            </tr>
            <tr>
              <td><code>BOLLARD_NVIDIA_NIM_API_KEY</code></td>
              <td>string</td>
              <td><code>null</code></td>
              <td>Nvidia NIM API key credential.</td>
            </tr>
            <tr>
              <td><code>BOLLARD_NVIDIA_NIM_BASE_URL</code></td>
              <td>string</td>
              <td><code>"https://integrate.api.nvidia.com/v1"</code></td>
              <td>Nvidia NIM base service endpoint.</td>
            </tr>
            <tr>
              <td><code>BOLLARD_EXTENSION_PORT</code></td>
              <td>integer</td>
              <td><code>null</code></td>
              <td>Port mapped to communicate with the active VS Code extension notification bridge.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="pgbouncer-and-poolers">4. PgBouncer & Transaction Poolers</h2>
      <p>
        When connecting to transaction-pooled database endpoints (like Supabase's <code>pooler.supabase.com</code> on port <code>6543</code>), database drivers often crash with a <code>DuplicatePreparedStatementError</code>.
      </p>
      <div className="callout warning">
        <div className="callout-title">Prepared Statement Conflicts</div>
        <p>
          PgBouncer routes queries across transient backend DB threads. Because prepared statements are stored in connection memory, this creates execution conflicts that cause client sessions to crash.
        </p>
      </div>
      <p>
        <strong>Bollard Solution</strong>: The database adapter checks if the connection URL contains <code>"pooler"</code> or <code>"pgbouncer"</code>. If matched, it disables statement caching by setting <code>statement_cache_size = 0</code> on the underlying <code>asyncpg</code> connection engine. This ensures query execution stability over pooled ports.
      </p>

      <h2 id="connection-string-examples">5. Connection String Examples by Provider</h2>
      <p>
        Here is the reference for connection formats required for popular database hosting providers:
      </p>

      <h3 id="local-docker-postgresql">Local Docker (PostgreSQL)</h3>
      <p>
        If you are running a local database inside a Docker container for development and testing:
      </p>
      <ul>
        <li>
          <strong>Connection String</strong>: <code>postgresql://[user]:[pass]@localhost:5432/[db_name]</code>
          <br /><em>Example: <code>postgresql://postgres:postgres@localhost:5432/dbcopilot</code></em>
        </li>
        <li>
          <strong>Seeding the Database</strong>: You can seed a local test database populated with tables (users, orders, secrets) to test safety limits and query interception rules:
          <br /><code>python examples/create_postgres_test_db.py</code>
        </li>
      </ul>
      
      <h3>Supabase (PostgreSQL)</h3>
      <ul>
        <li>
          <strong>Session (Direct Port 5432)</strong>: <code>postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:5432/postgres</code>
        </li>
        <li>
          <strong>Transaction Pooler (Port 6543)</strong>: <code>postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true</code>
          <br /><em>Note: Bollard automatically disables statement caching on this port to prevent session crashes.</em>
        </li>
      </ul>

      <h3>Neon (Serverless Postgres)</h3>
      <ul>
        <li>
          <strong>Connection String</strong>: <code>postgresql://[user]:[pass]@[neon-id].aws.neon.tech/neondb?sslmode=require</code>
          <br /><em>Note: SSL is required by Neon. Bollard will automatically append <code>sslmode=require</code> if you omit it.</em>
        </li>
      </ul>

      <h3>Render & Railway (PostgreSQL)</h3>
      <ul>
        <li>
          <strong>Connection String</strong>: <code>postgresql://[user]:[pass]@[host].oregon-postgres.render.com/[db_name]?sslmode=require</code>
        </li>
      </ul>

      <h3>Turso (Edge SQLite)</h3>
      <ul>
        <li>
          <strong>Connection String</strong>: <code>sqlite+libsql://[db-name]-[org-name].turso.io?uri=...</code> or standard local SQLite path: <code>sqlite:///c:/path/to/local.db</code>
        </li>
      </ul>

      <h3>MongoDB Atlas (Document Database)</h3>
      <ul>
        <li>
          <strong>Connection String</strong>: <code>mongodb+srv://[user]:[pass]@[cluster].mongodb.net/[db_name]?retryWrites=true&w=majority</code>
          <br /><em>Note: Requires installing Bollard with MongoDB support: <code>pip install bollard-mcp[mongodb]</code>.</em>
        </li>
      </ul>
    </main>
  );
}
