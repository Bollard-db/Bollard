import React from "react";

export default function FeedbackDocsPage() {
  return (
    <main className="content-body">
      <h1 id="ai-memory-and-history">AI Memory & History</h1>
      <p>
        AI agents frequently make database query errors because they lack knowledge of team-specific business definitions, deprecated columns, and soft-delete setups. Bollard resolves this by providing a local learning loop and session context tracking history.
      </p>

      <h2 id="corrections-loop">1. The Corrections Loop</h2>
      <p>
        If an AI agent compiles a query that is syntactically valid but semantically incorrect (such as querying <code>signup_date</code> instead of the updated <code>created_at</code> column), you can log a correction:
      </p>
      <pre>
        <code>
{`log_correction(
  connection="local_pg",
  original_query="SELECT * FROM users WHERE signup_date > '2026-01-01';",
  corrected_query="SELECT * FROM users WHERE created_at > '2026-01-01';",
  note="signup_date column is deprecated. Always use created_at."
)`}
        </code>
      </pre>
      <p>
        Bollard persists this correction payload in your local user data directory. The next time the AI agent queries the database, it loads the corrections database and uses it as context to adjust its SQL generation.
      </p>

      {/* Corrections Loop Diagram */}
      <div className="step-flow">
        <div className="step-flow-main">
          <div className="step-row">
            <div className="step-lhs">
              <div className="step-num cyan">1</div>
              <div className="step-connector"/>
            </div>
            <div className="step-body">
              <h4>Developer logs correction</h4>
              <p>Call the MCP tool <code>log_correction(connection, original_query, corrected_query, note)</code></p>
            </div>
          </div>
          <div className="step-row">
            <div className="step-lhs">
              <div className="step-num">2</div>
              <div className="step-connector"/>
            </div>
            <div className="step-body">
              <h4>Stored in local database</h4>
              <p>Persisted to <code>corrections.json</code> in user data directory on disk</p>
            </div>
          </div>
          <div className="step-row">
            <div className="step-lhs">
              <div className="step-num">3</div>
              <div className="step-connector"/>
            </div>
            <div className="step-body">
              <h4>AI Agent reads resource</h4>
              <p>Fetches <code>bollard://corrections/local_pg</code> at the start of each session</p>
            </div>
          </div>
          <div className="step-row">
            <div className="step-lhs">
              <div className="step-num green">4</div>
            </div>
            <div className="step-body">
              <h4>Automatic context injection</h4>
              <p>Agent avoids deprecated columns in all future queries automatically</p>
            </div>
          </div>
        </div>
        <div className="step-aside">
          <div className="step-aside-label">Example Correction</div>
          <div className="step-aside-card">
            {'{'}  <br/>
            &nbsp;&nbsp;<span className="sc-k">&quot;table&quot;</span>: <span className="sc-v">&quot;users&quot;</span>,<br/>
            &nbsp;&nbsp;<span className="sc-k">&quot;column&quot;</span>: <span className="sc-v">&quot;user_name&quot;</span>,<br/>
            &nbsp;&nbsp;<span className="sc-k">&quot;note&quot;</span>: <span className="sc-v">&quot;Use full_name&quot;</span><br/>
            {'}'}
          </div>
        </div>
      </div>

      <h2 id="query-history">2. Query History Resources</h2>
      <p>
        Bollard tracks the last 100 queries run on an active connection. The server exposes this log buffer to the client editor as a protocol resource:
      </p>
      <pre>
        <code>
          {"bollard://history/{connection_alias}"}
        </code>
      </pre>
      <p>
        The AI reads this history block at the start of each query turn to maintain session context, allowing it to remember past actions, schemas checked, and results without requiring you to re-explain the current state.
      </p>

      <h2 id="mcp-resources">3. Active Connections and Policies Resources</h2>
      <p>
        Bollard exposes two other system resources:
      </p>
      <ul>
        <li>
          <strong>bollard://connections</strong>: Read by the AI agent on startup to discover active database aliases, dialects, and permissions.
        </li>
        <li>
          <strong>bollard://policies/{"{alias}"}</strong>: Contains detailed information regarding active connection mode policies, LIMIT defaults, and forbidden tables.
        </li>
      </ul>
    </main>
  );
}
