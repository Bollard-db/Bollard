import React from "react";

export default function CompressionDocsPage() {
  return (
    <main className="content-body">
      <h1 id="context-compression">Smart Compression</h1>
      <p>
        AI models do not need to parse thousands of raw database rows to answer structural questions. Doing so dilutes their context window and increases API billing. Bollard optimizes LLM token usage by compressing large query results under <strong>Smart Mode</strong>.
      </p>

      <h2 id="token-math">The Math: Why Compression Matters</h2>
      <p>
        In traditional database MCP gateways, running a query that returns 1,000 rows dumps the raw text directly into the LLM context:
      </p>
      <ul>
        <li>
          <strong>Traditional Gateway</strong>: 1,000 rows $\times$ 5 columns $\times$ 8 tokens per cell = <strong>40,000 tokens</strong> consumed.
        </li>
        <li>
          <strong>Bollard Smart Mode</strong>: 10 sample rows + column aggregation metrics = <strong>~1,200 tokens</strong> consumed.
        </li>
      </ul>
      <p>
        This represents a <strong>97% reduction in context window footprint</strong>. This optimization reduces query latency, mitigates model hallucinations, and cuts API inference costs.
      </p>

      <h2 id="output-modes">Output Modes</h2>
      <p>
        You can configure the formatting profile globally per connection, or override it dynamically for a single query using the <code>output_mode</code> parameter in <code>execute_query()</code>:
      </p>
      
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Mode</th>
              <th>Trigger Condition</th>
              <th>Output Format Returned to LLM</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>smart</code></td>
              <td>Query results $\le$ 15 rows.</td>
              <td>Returns the full raw dataset in clean markdown.</td>
            </tr>
            <tr>
              <td><code>smart</code></td>
              <td>Query results &gt; 15 rows.</td>
              <td>Returns 10 sample rows + column profile statistics + workspace CSV link.</td>
            </tr>
            <tr>
              <td><code>analytics</code></td>
              <td>All queries.</td>
              <td>Returns <strong>zero raw database rows</strong>. Transmits column schemas and count statistics only.</td>
            </tr>
            <tr>
              <td><code>raw</code></td>
              <td>All queries.</td>
              <td>Disables compression. Returns all database rows in raw markdown text.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="automatic-csv-export">Automatic CSV Export</h2>
      <p>
        When a query is compressed under <code>smart</code> mode, the full dataset remains accessible to the developer. Bollard writes the complete results to a local file in your workspace:
      </p>
      <pre>
        <code>
{`-- File generated in workspace root:
query_result.csv`}
        </code>
      </pre>
      <p>
        The server appends a clickable file-scheme link directly to the response returned to the editor:
      </p>
      <pre>
        <code>
{`*(Written to [query_result.csv](file:///c:/users/deepak/desktop/bollard-mcp/query_result.csv). The AI receives only this summary.)*`}
        </code>
      </pre>
      <p>
        You can click this link inside your editor to immediately open the full dataset in a separate tab, keeping your chat interface clean and your LLM context thin.
      </p>

      {/* Smart Mode Terminal Output */}
      <div className="terminal-panel">
        <div className="terminal-bar">
          <div className="t-dots">
            <span className="t-dot r"/><span className="t-dot a"/><span className="t-dot g"/>
          </div>
          <span className="t-label">Query Result</span>
          <span className="t-badge">SMART MODE</span>
        </div>
        <div className="terminal-body">
          <div className="t-info">1,247 rows returned — <span>showing 10-row preview</span></div>
          <table className="t-table">
            <thead>
              <tr><th>id</th><th>email</th><th>created_at</th><th>status</th></tr>
            </thead>
            <tbody>
              <tr><td>1</td><td>alice@acme.com</td><td>2022-03-14</td><td>active</td></tr>
              <tr><td>2</td><td>bob@corp.io</td><td>2022-05-01</td><td>active</td></tr>
              <tr><td>3</td><td>carol@dev.net</td><td>2022-07-22</td><td>pending</td></tr>
              <tr><td>4</td><td>dan@startup.co</td><td>2022-09-09</td><td>active</td></tr>
              <tr><td>5</td><td>eve@labs.ai</td><td>2023-01-15</td><td>inactive</td></tr>
              <tr><td>6</td><td>frank@mail.com</td><td>2023-03-28</td><td>active</td></tr>
              <tr><td>7</td><td>grace@apps.io</td><td>2023-06-11</td><td>pending</td></tr>
              <tr><td>8</td><td>hal@tech.dev</td><td>2023-08-04</td><td>active</td></tr>
              <tr><td>9</td><td>iris@data.co</td><td>2023-11-19</td><td>active</td></tr>
              <tr><td>10</td><td>jack@cloud.net</td><td>2024-02-07</td><td>inactive</td></tr>
            </tbody>
          </table>
          <div className="t-ellipsis">&bull; &bull; &bull; &bull; &bull;</div>
          <div className="t-stats">
            <span className="sk">id</span>: integer, range <span className="sv">1–1247</span>{" | "}
            <span className="sk">email</span>: string, <span className="sv">1247 unique</span>{" | "}
            <span className="sk">created_at</span>: timestamp, <span className="sv">2022-03 – 2024-06</span>{" | "}
            <span className="sk">status</span>: categorical, <span className="sv">4 distinct values</span>
          </div>
          <div className="t-csv">query_result_20240618.csv (full dataset, 1247 rows)</div>
        </div>
      </div>
    </main>
  );
}
