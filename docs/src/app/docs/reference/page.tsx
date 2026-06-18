import React from "react";

export default function ReferenceDocsPage() {
  return (
    <main className="content-body">
      <h1 id="api-reference">API Reference</h1>
      <p>
        This section provides a comprehensive technical reference for all tools and resources exposed by the Bollard MCP Server. Integrate these calls into your agentic workflow to manage database connections, introspect schemas, perform safe queries, and log user-corrected behaviors.
      </p>

      {/* CONNECTION TOOLS */}
      <h2 id="connection-tools">Connection Tools</h2>
      <p>
        These tools initialize, retrieve, and destroy active database sessions in the server. All other tools require an active connection alias.
      </p>

      {/* connect_database */}
      <h3 id="connect-database">connect_database</h3>
      <p>Connect to a database engine and cache its schema blueprint.</p>
      <pre>
        <code>
          {`connect_database(
  connection_string: string,
  alias: string,
  mode: "read_only" | "read_write" | "admin" = "read_only",
  max_rows: number = 1000,
  forbidden_tables: string[] | null = null,
  save_credential: boolean = true,
  output_mode: "smart" | "raw" | "analytics" = "smart"
)`}
        </code>
      </pre>

      <div className="params-list">
        <div className="param-row">
          <div className="param-meta">
            <span className="param-name">connection_string</span>
            <div className="badge-wrapper">
              <span className="badge-type">string</span>
              <span className="badge-required">required</span>
            </div>
          </div>
          <div className="param-desc">
            <p>The full connection URL containing credentials, hosts, ports, and databases.</p>
            <p className="param-default">Example: <code>postgresql://postgres:pwd@127.0.0.1:5432/db</code></p>
          </div>
        </div>

        <div className="param-row">
          <div className="param-meta">
            <span className="param-name">alias</span>
            <div className="badge-wrapper">
              <span className="badge-type">string</span>
              <span className="badge-required">required</span>
            </div>
          </div>
          <div className="param-desc">
            <p>A short identifier for referencing the connection (e.g., <code>prod</code>, <code>staging</code>, <code>local_pg</code>).</p>
          </div>
        </div>

        <div className="param-row">
          <div className="param-meta">
            <span className="param-name">mode</span>
            <div className="badge-wrapper">
              <span className="badge-type">string</span>
              <span className="badge-optional">optional</span>
            </div>
          </div>
          <div className="param-desc">
            <p>Access level. Under <code>read_only</code> (default), write operations are strictly blocked. Under <code>read_write</code>, writes are gated. Under <code>admin</code>, drop/truncate checks are elevated.</p>
            <p className="param-default">Default: <code>"read_only"</code></p>
          </div>
        </div>

        <div className="param-row">
          <div className="param-meta">
            <span className="param-name">max_rows</span>
            <div className="badge-wrapper">
              <span className="badge-type">integer</span>
              <span className="badge-optional">optional</span>
            </div>
          </div>
          <div className="param-desc">
            <p>Hard limit applied to query select results before truncation.</p>
            <p className="param-default">Default: <code>1000</code></p>
          </div>
        </div>

        <div className="param-row">
          <div className="param-meta">
            <span className="param-name">forbidden_tables</span>
            <div className="badge-wrapper">
              <span className="badge-type">array[str]</span>
              <span className="badge-optional">optional</span>
            </div>
          </div>
          <div className="param-desc">
            <p>List of table wildcards to prevent introspecting or selecting (e.g., <code>*.passwords</code>, <code>secrets.*</code>).</p>
            <p className="param-default">Default: <code>null</code></p>
          </div>
        </div>

        <div className="param-row">
          <div className="param-meta">
            <span className="param-name">save_credential</span>
            <div className="badge-wrapper">
              <span className="badge-type">boolean</span>
              <span className="badge-optional">optional</span>
            </div>
          </div>
          <div className="param-desc">
            <p>If true, encrypts and stores connection string variables in the local OS Keyring or backup vault.</p>
            <p className="param-default">Default: <code>true</code></p>
          </div>
        </div>

        <div className="param-row">
          <div className="param-meta">
            <span className="param-name">output_mode</span>
            <div className="badge-wrapper">
              <span className="badge-type">string</span>
              <span className="badge-optional">optional</span>
            </div>
          </div>
          <div className="param-desc">
            <p>Controls compression returned to the LLM. Options: <code>smart</code> (truncates large sets), <code>raw</code> (always dumps full text), <code>analytics</code> (sends metrics, zero rows).</p>
            <p className="param-default">Default: <code>"smart"</code></p>
          </div>
        </div>
      </div>

      {/* disconnect */}
      <h3 id="disconnect">disconnect</h3>
      <p>Terminate an active database connection and clear related schema caches.</p>
      <pre>
        <code>
          {`disconnect(alias: string)`}
        </code>
      </pre>
      <div className="params-list">
        <div className="param-row">
          <div className="param-meta">
            <span className="param-name">alias</span>
            <div className="badge-wrapper">
              <span className="badge-type">string</span>
              <span className="badge-required">required</span>
            </div>
          </div>
          <div className="param-desc">
            <p>The active database identifier to disconnect.</p>
          </div>
        </div>
      </div>

      {/* list_connections */}
      <h3 id="list-connections">list_connections</h3>
      <p>Retrieve a list of all currently active database sessions on the Bollard server.</p>
      <pre>
        <code>
          {`list_connections()`}
        </code>
      </pre>
      <p>Returns a markdown table indicating active aliases, SQL dialects, modes, and connection status.</p>

      {/* reconnect_saved */}
      <h3 id="reconnect-saved">reconnect_saved</h3>
      <p>Restore a saved credential connection from the local OS Keyring vault.</p>
      <pre>
        <code>
          {`reconnect_saved(alias: string)`}
        </code>
      </pre>
      <div className="params-list">
        <div className="param-row">
          <div className="param-meta">
            <span className="param-name">alias</span>
            <div className="badge-wrapper">
              <span className="badge-type">string</span>
              <span className="badge-required">required</span>
            </div>
          </div>
          <div className="param-desc">
            <p>The saved connection alias to reload from OS Keyring storage.</p>
          </div>
        </div>
      </div>


      {/* SCHEMA EXPLORATION TOOLS */}
      <h2 id="schema-exploration-tools">Schema Exploration Tools</h2>
      <p>
        Use these tools to inspect database layouts, columns, types, counts, and structures. Caches are used where possible to accelerate queries.
      </p>

      {/* list_tables */}
      <h3 id="list-tables">list_tables</h3>
      <p>List all tables in the connected database alongside estimated row counts and column sizes.</p>
      <pre>
        <code>
          {`list_tables(connection: string)`}
        </code>
      </pre>
      <div className="params-list">
        <div className="param-row">
          <div className="param-meta">
            <span className="param-name">connection</span>
            <div className="badge-wrapper">
              <span className="badge-type">string</span>
              <span className="badge-required">required</span>
            </div>
          </div>
          <div className="param-desc">
            <p>The connected database alias (e.g., <code>prod</code>).</p>
          </div>
        </div>
      </div>

      {/* describe_table */}
      <h3 id="describe-table">describe_table</h3>
      <p>Show columns, datatypes, nullability, keys, default constraints, and foreign key relations for a table.</p>
      <pre>
        <code>
          {`describe_table(connection: string, table_name: string)`}
        </code>
      </pre>
      <div className="params-list">
        <div className="param-row">
          <div className="param-meta">
            <span className="param-name">connection</span>
            <div className="badge-wrapper">
              <span className="badge-type">string</span>
              <span className="badge-required">required</span>
            </div>
          </div>
          <div className="param-desc">
            <p>The active database alias.</p>
          </div>
        </div>
        <div className="param-row">
          <div className="param-meta">
            <span className="param-name">table_name</span>
            <div className="badge-wrapper">
              <span className="badge-type">string</span>
              <span className="badge-required">required</span>
            </div>
          </div>
          <div className="param-desc">
            <p>Name of the table to describe (case-sensitive).</p>
          </div>
        </div>
      </div>

      {/* get_sample_data */}
      <h3 id="get-sample-data">get_sample_data</h3>
      <p>Fetch sample rows to observe formatting, dates, timestamps, and column types.</p>
      <pre>
        <code>
          {`get_sample_data(connection: string, table_name: string, limit: number = 5)`}
        </code>
      </pre>
      <div className="params-list">
        <div className="param-row">
          <div className="param-meta">
            <span className="param-name">connection</span>
            <div className="badge-wrapper">
              <span className="badge-type">string</span>
              <span className="badge-required">required</span>
            </div>
          </div>
          <div className="param-desc">
            <p>The active database alias.</p>
          </div>
        </div>
        <div className="param-row">
          <div className="param-meta">
            <span className="param-name">table_name</span>
            <div className="badge-wrapper">
              <span className="badge-type">string</span>
              <span className="badge-required">required</span>
            </div>
          </div>
          <div className="param-desc">
            <p>Target table name.</p>
          </div>
        </div>
        <div className="param-row">
          <div className="param-meta">
            <span className="param-name">limit</span>
            <div className="badge-wrapper">
              <span className="badge-type">integer</span>
              <span className="badge-optional">optional</span>
            </div>
          </div>
          <div className="param-desc">
            <p>Max rows to fetch (capped at 25).</p>
            <p className="param-default">Default: <code>5</code></p>
          </div>
        </div>
      </div>

      {/* refresh_schema */}
      <h3 id="refresh-schema">refresh_schema</h3>
      <p>Clear internal schema blueprints and force metadata introspection on the database.</p>
      <pre>
        <code>
          {`refresh_schema(connection: string)`}
        </code>
      </pre>
      <div className="params-list">
        <div className="param-row">
          <div className="param-meta">
            <span className="param-name">connection</span>
            <div className="badge-wrapper">
              <span className="badge-type">string</span>
              <span className="badge-required">required</span>
            </div>
          </div>
          <div className="param-desc">
            <p>Database alias to sync.</p>
          </div>
        </div>
      </div>


      {/* QUERY EXECUTION TOOLS */}
      <h2 id="query-execution-tools">Query Execution Tools</h2>
      <p>
        These tools process SQL statements, run intent validations, score risk thresholds, and manage write permissions.
      </p>

      {/* preview_query */}
      <h3 id="preview-query">preview_query</h3>
      <p>Dry-run statements to see intent warnings, safety check rejections, and estimated EXPLAIN cost estimates.</p>
      <pre>
        <code>
          {`preview_query(connection: string, sql: string)`}
        </code>
      </pre>
      <div className="params-list">
        <div className="param-row">
          <div className="param-meta">
            <span className="param-name">connection</span>
            <div className="badge-wrapper">
              <span className="badge-type">string</span>
              <span className="badge-required">required</span>
            </div>
          </div>
          <div className="param-desc">
            <p>Active database alias.</p>
          </div>
        </div>
        <div className="param-row">
          <div className="param-meta">
            <span className="param-name">sql</span>
            <div className="badge-wrapper">
              <span className="badge-type">string</span>
              <span className="badge-required">required</span>
            </div>
          </div>
          <div className="param-desc">
            <p>The SQL statement to check.</p>
          </div>
        </div>
      </div>

      {/* execute_query */}
      <h3 id="execute-query">execute_query</h3>
      <p>Run SQL query pipelines under risk gating rules.</p>
      <pre>
        <code>
          {`execute_query(
  connection: string,
  sql: string,
  confirmed: boolean = false,
  pin: string | null = null,
  confirmation_phrase: string | null = null,
  output_mode: string | null = null
)`}
        </code>
      </pre>
      <div className="params-list">
        <div className="param-row">
          <div className="param-meta">
            <span className="param-name">connection</span>
            <div className="badge-wrapper">
              <span className="badge-type">string</span>
              <span className="badge-required">required</span>
            </div>
          </div>
          <div className="param-desc">
            <p>Active database alias.</p>
          </div>
        </div>
        <div className="param-row">
          <div className="param-meta">
            <span className="param-name">sql</span>
            <div className="badge-wrapper">
              <span className="badge-type">string</span>
              <span className="badge-required">required</span>
            </div>
          </div>
          <div className="param-desc">
            <p>SQL query to execute.</p>
          </div>
        </div>
        <div className="param-row">
          <div className="param-meta">
            <span className="param-name">confirmed</span>
            <div className="badge-wrapper">
              <span className="badge-type">boolean</span>
              <span className="badge-optional">optional</span>
            </div>
          </div>
          <div className="param-desc">
            <p>Required assertion for write operations.</p>
            <p className="param-default">Default: <code>false</code></p>
          </div>
        </div>
        <div className="param-row">
          <div className="param-meta">
            <span className="param-name">pin</span>
            <div className="badge-wrapper">
              <span className="badge-type">string</span>
              <span className="badge-optional">optional</span>
            </div>
          </div>
          <div className="param-desc">
            <p>4-digit clipboard confirmation code requested from the extension bridge.</p>
            <p className="param-default">Default: <code>null</code></p>
          </div>
        </div>
        <div className="param-row">
          <div className="param-meta">
            <span className="param-name">confirmation_phrase</span>
            <div className="badge-wrapper">
              <span className="badge-type">string</span>
              <span className="badge-optional">optional</span>
            </div>
          </div>
          <div className="param-desc">
            <p>String verification sequence required for HIGH or CRITICAL level operations (e.g., <code>"confirm migration"</code>).</p>
            <p className="param-default">Default: <code>null</code></p>
          </div>
        </div>
        <div className="param-row">
          <div className="param-meta">
            <span className="param-name">output_mode</span>
            <div className="badge-wrapper">
              <span className="badge-type">string</span>
              <span className="badge-optional">optional</span>
            </div>
          </div>
          <div className="param-desc">
            <p>Override connection's default formatting mode for this query results payload (<code>smart</code>, <code>raw</code>, <code>analytics</code>).</p>
            <p className="param-default">Default: <code>null</code></p>
          </div>
        </div>
      </div>


      {/* TABLE PROFILER TOOLS */}
      <h2 id="table-profiler-tools">Table Profiler Tools</h2>
      <p>
        Generate column stats natively on the database server.
      </p>

      {/* profile_table */}
      <h3 id="profile-table">profile_table</h3>
      <p>Run native aggregates (null percentages, distinct values, min/max/average, Top-5 categorization distributions) directly in SQL.</p>
      <pre>
        <code>
          {`profile_table(connection: string, table_name: string)`}
        </code>
      </pre>
      <div className="params-list">
        <div className="param-row">
          <div className="param-meta">
            <span className="param-name">connection</span>
            <div className="badge-wrapper">
              <span className="badge-type">string</span>
              <span className="badge-required">required</span>
            </div>
          </div>
          <div className="param-desc">
            <p>Active database alias.</p>
          </div>
        </div>
        <div className="param-row">
          <div className="param-meta">
            <span className="param-name">table_name</span>
            <div className="badge-wrapper">
              <span className="badge-type">string</span>
              <span className="badge-required">required</span>
            </div>
          </div>
          <div className="param-desc">
            <p>Name of the table to profile.</p>
          </div>
        </div>
      </div>


      {/* FEEDBACK & CORRECTIONS */}
      <h2 id="feedback-and-corrections">Feedback & Corrections</h2>
      <p>
        Manage local feedback loops and session logs so AI models adapt their queries based on business rules.
      </p>

      {/* log_correction */}
      <h3 id="log-correction">log_correction</h3>
      <p>Log a semantic correction payload into the persistent storage directory.</p>
      <pre>
        <code>
          {`log_correction(
  connection: string,
  original_query: string,
  corrected_query: string,
  note: string
)`}
        </code>
      </pre>
      <div className="params-list">
        <div className="param-row">
          <div className="param-meta">
            <span className="param-name">connection</span>
            <div className="badge-wrapper">
              <span className="badge-type">string</span>
              <span className="badge-required">required</span>
            </div>
          </div>
          <div className="param-desc">
            <p>Active database alias.</p>
          </div>
        </div>
        <div className="param-row">
          <div className="param-meta">
            <span className="param-name">original_query</span>
            <div className="badge-wrapper">
              <span className="badge-type">string</span>
              <span className="badge-required">required</span>
            </div>
          </div>
          <div className="param-desc">
            <p>The incorrect query generated by the AI agent.</p>
          </div>
        </div>
        <div className="param-row">
          <div className="param-meta">
            <span className="param-name">corrected_query</span>
            <div className="badge-wrapper">
              <span className="badge-type">string</span>
              <span className="badge-required">required</span>
            </div>
          </div>
          <div className="param-desc">
            <p>The correct SQL query syntax or expression.</p>
          </div>
        </div>
        <div className="param-row">
          <div className="param-meta">
            <span className="param-name">note</span>
            <div className="badge-wrapper">
              <span className="badge-type">string</span>
              <span className="badge-required">required</span>
            </div>
          </div>
          <div className="param-desc">
            <p>Plain English instruction explanation (e.g., <code>"signup_date is deprecated, always use created_at"</code>).</p>
          </div>
        </div>
      </div>

      {/* get_query_history */}
      <h3 id="get-query-history">get_query_history</h3>
      <p>Inspect query execution records logged during the active session.</p>
      <pre>
        <code>
          {`get_query_history(connection: string, last_n: number = 10)`}
        </code>
      </pre>
      <div className="params-list">
        <div className="param-row">
          <div className="param-meta">
            <span className="param-name">connection</span>
            <div className="badge-wrapper">
              <span className="badge-type">string</span>
              <span className="badge-required">required</span>
            </div>
          </div>
          <div className="param-desc">
            <p>Active database alias.</p>
          </div>
        </div>
        <div className="param-row">
          <div className="param-meta">
            <span className="param-name">last_n</span>
            <div className="badge-wrapper">
              <span className="badge-type">integer</span>
              <span className="badge-optional">optional</span>
            </div>
          </div>
          <div className="param-desc">
            <p>Number of query logs to display (capped at 50).</p>
            <p className="param-default">Default: <code>10</code></p>
          </div>
        </div>
      </div>

      {/* get_corrections */}
      <h3 id="get-corrections">get_corrections</h3>
      <p>Retrieve all logged corrections and semantic notes recorded for a database.</p>
      <pre>
        <code>
          {`get_corrections(connection: string)`}
        </code>
      </pre>
      <div className="params-list">
        <div className="param-row">
          <div className="param-meta">
            <span className="param-name">connection</span>
            <div className="badge-wrapper">
              <span className="badge-type">string</span>
              <span className="badge-required">required</span>
            </div>
          </div>
          <div className="param-desc">
            <p>Active database alias.</p>
          </div>
        </div>
      </div>


      {/* MCP RESOURCE ENDPOINTS */}
      <h2 id="mcp-resource-endpoints">MCP Resource Endpoints</h2>
      <p>
        These standard protocol URIs are automatically loaded and parsed by editor agents (e.g., Cursor, Claude Desktop) to initialize database context when compiling commands.
      </p>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>URI Pattern</th>
              <th>Resource Target Description</th>
              <th>Format Returned</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>bollard://connections</code></td>
              <td>Lists all currently connected database aliases.</td>
              <td>Markdown bulleted summaries.</td>
            </tr>
            <tr>
              <td><code>bollard://schema/{"{alias}"}</code></td>
              <td>Introspects and loads the cached SQL blueprint mapping.</td>
              <td>Structured database schema blocks.</td>
            </tr>
            <tr>
              <td><code>bollard://history/{"{alias}"}</code></td>
              <td>Loads recent query session logs (up to 10 queries) for continuity context.</td>
              <td>Chronological query execution markdown.</td>
            </tr>
            <tr>
              <td><code>bollard://corrections/{"{alias}"}</code></td>
              <td>Retrieves all semantic rules and column corrections logged by the team.</td>
              <td>Instruction manual mapping.</td>
            </tr>
            <tr>
              <td><code>bollard://policies/{"{alias}"}</code></td>
              <td>Shows active write permission settings and forbidden table scopes.</td>
              <td>Text description policies.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  );
}
