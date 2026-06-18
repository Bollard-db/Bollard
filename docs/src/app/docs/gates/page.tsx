import React from "react";

export default function GatesDocsPage() {
  return (
    <main className="content-body">
      <h1 id="friction-gates">Write Gates & PINs</h1>
      <p>
        To prevent AI models from running updates autonomously without human validation, Bollard enforces physical verification for all write operations. This confirmation is handled by a local HTTP bridge running inside your editor extension.
      </p>

      <h2 id="pin-generation-flow">1. The PIN Generation Flow</h2>
      <p>
        When a query is scored as MEDIUM, HIGH, or CRITICAL risk, the execution blocks and enters a secure gating state:
      </p>
      <ol>
        <li>
          The server detects the local extension port from the <code>BOLLARD_EXTENSION_PORT</code> environment variable.
        </li>
        <li>
          It sends an HTTP POST request to the extension's local <code>/request_pin</code> endpoint containing the SQL query payload.
        </li>
        <li>
          The extension displays a native desktop notification containing a unique 4-digit security PIN and copies the code to your system clipboard.
        </li>
        <li>
          The server pauses execution and returning a markdown warning, prompting the AI agent to request the PIN from the user.
        </li>
        <li>
          Once you provide the PIN, the AI agent invokes the tool again passing the PIN as an argument, allowing the server to verify the key and execute the SQL safely.
        </li>
      </ol>

      <h2 id="extension-bridge">2. The Extension Bridge</h2>
      <p>
        The HTTP bridge acts as a validation loop. Because the MCP server runs in a headless background shell, it cannot draw visual UI dialogs. The bridge delegates this responsibility to the local VS Code extension.
      </p>
      <ul>
        <li>
          <strong>Clipboard Security</strong>: By automatically copying the PIN to your clipboard, Bollard minimizes manual typing. You can quickly paste the PIN into the chat dialog.
        </li>
        <li>
          <strong>Session Scopes</strong>: PINs are single-use tokens. Once validated by <code>execute_query</code>, the PIN is immediately expired to prevent reuse of authorization keys.
        </li>
      </ul>

      {/* PIN Notification Toast */}
      <div className="toast-scene">
        <div className="toast-card">
          <div className="toast-top">
            <div className="toast-icon">B</div>
            <div className="toast-title">Bollard — Write Authorization Required</div>
          </div>
          <div className="toast-body">
            Query will modify <strong>24 rows</strong>. Your security PIN is{" "}
            <span className="toast-pin">7 4 9 1</span> — copied to clipboard.
          </div>
          <div className="toast-actions">
            <button className="toast-btn ok">Approve</button>
            <button className="toast-btn no">Deny</button>
          </div>
          <div className="toast-footer">Enter PIN in your editor chat to authorize execution.</div>
        </div>
      </div>

      <h2 id="terminal-bypass">3. Command-Line Restrictions</h2>
      <p>
        If you run the MCP server directly in a terminal shell (outside Cursor or VS Code where the notification extension bridge is not active), write queries are blocked by default:
      </p>
      <pre>
        <code>
{`Write operations are blocked outside the Bollard VS Code Extension.
Please use the Extension Host window to run write queries safely.`}
        </code>
      </pre>
      <p>
        To run write scripts in terminal shells, ensure you run in read-only connection mode, or connect under configurations that do not trigger write events.
      </p>

      <h2 id="admin-mode-override">4. Admin Mode Overrides</h2>
      <p>
        Queries scored as EXTREME risk (such as <code>DROP TABLE</code>, <code>TRUNCATE</code>, or database drops) are blocked immediately under default connection sessions.
      </p>
      <p>
        To bypass this block for legitimate admin maintenance operations:
      </p>
      <ul>
        <li>
          You must disconnect and re-establish the connection specifying <code>mode="admin"</code> inside the <code>connect_database()</code> parameters.
        </li>
        <li>
          Under <code>admin</code> mode, EXTREME risk operations are allowed to proceed through the standard security PIN gate instead of being rejected.
        </li>
      </ul>
    </main>
  );
}
