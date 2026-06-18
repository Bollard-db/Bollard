import React from "react";

export default function ProfilerDocsPage() {
  return (
    <main className="content-body">
      <h1 id="database-profiler">Database Table Profiler</h1>
      <p>
        The table profiler in Bollard generates statistical summaries of database tables natively on the SQL engine. It avoids loading raw rows into local memory, preventing memory spikes and high latency over network connections.
      </p>

      <h2 id="pushed-aggregations">1. How it Works (Pushed Aggregation)</h2>
      <p>
        When you run <code>profile_table(connection="prod", table_name="users")</code>, Bollard inspects the cached schema columns and types. It constructs and executes parallel, single-round-trip sub-queries for each column.
      </p>
      <p>
        <strong>No Pandas, Numpy, or local processing is used.</strong> The database server performs all calculations. Only a compact metadata payload containing the stats is sent back to the MCP server:
      </p>
      <pre>
        <code>
{`SELECT 
  COUNT(*) AS total_rows,
  COUNT("status") AS non_null_count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE "status" IS NULL) / NULLIF(COUNT(*), 0), 2) AS null_pct,
  COUNT(DISTINCT "status") AS distinct_count
FROM "users";`}
        </code>
      </pre>

      <h2 id="metrics-gathered">2. Metrics Gathered</h2>
      <p>
        For each column, the profile aggregates the following statistics:
      </p>
      <ul>
        <li>
          <strong>All Columns</strong>: Total row counts, non-null counts, and null percentages (<code>NULL%</code>).
        </li>
        <li>
          <strong>Numeric Columns</strong> (integers, floats, decimals, serials): <code>MIN</code>, <code>MAX</code>, and <code>AVG</code> values.
        </li>
        <li>
          <strong>Datetime Columns</strong> (dates, timestamps, time): <code>MIN</code> (earliest entry) and <code>MAX</code> (latest entry) ranges.
        </li>
        <li>
          <strong>Categorical Columns</strong>: If a column contains 100 or fewer distinct values, Bollard runs a value distribution query and returns the Top-5 occurring values alongside their frequencies.
        </li>
      </ul>

      {/* Table Profile Summary */}
      <div className="profile-panel">
        <div className="profile-hdr">
          <span className="profile-hdr-title">Table: orders</span>
          <span className="profile-hdr-meta">24,891 rows • 8 columns • profiled in 0.43s</span>
        </div>
        <div className="profile-body">
          <div className="profile-tbl-wrap">
            <table className="profile-tbl">
              <thead>
                <tr><th>Column</th><th>Type</th><th>Null%</th><th>Min</th><th>Max</th><th>Unique</th></tr>
              </thead>
              <tbody>
                <tr><td>id</td><td>integer</td><td>0%</td><td>1</td><td>24891</td><td>24891</td></tr>
                <tr><td>status</td><td>varchar</td><td>2%</td><td>—</td><td>—</td><td>4</td></tr>
                <tr><td>country</td><td>varchar</td><td>0%</td><td>—</td><td>—</td><td>47</td></tr>
                <tr><td>total_amount</td><td>decimal</td><td>1%</td><td>0.50</td><td>9999.99</td><td>—</td></tr>
                <tr><td>created_at</td><td>timestamp</td><td>0%</td><td>2021-01</td><td>2024-06</td><td>—</td></tr>
              </tbody>
            </table>
          </div>
          <div className="profile-charts">
            <div className="pc-label">status — Top 5</div>
            {[{l:"active",w:58},{l:"pending",w:22},{l:"closed",w:15},{l:"refund",w:5}].map(r=>
              <div key={r.l} className="bar-row">
                <span className="bar-lbl">{r.l}</span>
                <div className="bar-track"><div className="bar-fill" style={{width:`${r.w}%`}}/></div>
                <span className="bar-pct">{r.w}%</span>
              </div>
            )}
            <div className="pc-label">country — Top 5</div>
            {[{l:"US",w:41},{l:"UK",w:18},{l:"IN",w:12},{l:"DE",w:9},{l:"CA",w:8}].map(r=>
              <div key={r.l} className="bar-row">
                <span className="bar-lbl">{r.l}</span>
                <div className="bar-track"><div className="bar-fill" style={{width:`${r.w}%`}}/></div>
                <span className="bar-pct">{r.w}%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <h2 id="security-enforcement">3. Security Policy Integration</h2>
      <p>
        The table profiler integrates with the connection's permission policy:
      </p>
      <ul>
        <li>
          <strong>Forbidden Table Verifications</strong>: Prior to executing profile sub-queries, Bollard checks if the target table matches any pattern in the <code>forbidden_tables</code> list. If matched, the profile is aborted and returns an access rejection message.
        </li>
        <li>
          <strong>Intent-Based SELECT * Interception</strong>: In <code>preview_query</code>, bare <code>SELECT * FROM table</code> queries on large tables (exceeding 15 rows) are automatically intercepted and redirected to <code>profile_table</code>. If the target table is forbidden, the interception is bypassed to let the query validator block the request, preventing metadata leaks.
        </li>
      </ul>
    </main>
  );
}
