import React from "react";

export default function SafetyDocsPage() {
  return (
    <main className="content-body">
      <h1 id="threat-vector-model">Dynamic Risk Engine</h1>
      <p>
        Rather than blocking write queries outright or allowing dangerous updates blindly, Bollard scores the threat vector of every SQL command dynamically. It determines a risk level from LOW to EXTREME and applies a proportionate amount of friction.
      </p>

      <h2 id="risk-level-matrix">Risk Level Matrix</h2>
      <p>
        The threat scoring framework is computed in a three-stage validation pipeline: <strong>AST parsing</strong> (verifies statement architecture), <strong>EXPLAIN plan checking</strong> (retrieves database cost metrics), and <strong>schema policies</strong> (detects sensitive tables).
      </p>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Risk Level</th>
              <th>Triggers</th>
              <th>Friction Applied</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>LOW</strong></td>
              <td>Standard <code>SELECT</code> queries.</td>
              <td>None. Auto-executes immediately.</td>
            </tr>
            <tr>
              <td><strong>MEDIUM</strong></td>
              <td>Write operations (DML/DCL) affecting less than 5 rows.</td>
              <td>Prompts user for a temporary one-time OS Security PIN.</td>
            </tr>
            <tr>
              <td><strong>HIGH</strong></td>
              <td>Write operations (DML/DCL) affecting 5 or more rows.</td>
              <td>OS Security PIN + typing a confirmation phrase in chat.</td>
            </tr>
            <tr>
              <td><strong>CRITICAL</strong></td>
              <td>Schema alterations (DDL, such as <code>ALTER TABLE</code>).</td>
              <td>OS Security PIN + Suggested Reversal review + typing a migration phrase.</td>
            </tr>
            <tr>
              <td><strong>EXTREME</strong></td>
              <td>Destructive operations (<code>DROP TABLE</code>, <code>TRUNCATE</code>).</td>
              <td>Blocked immediately unless connected under <code>admin</code> mode.</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Friction Gates / Safety Mockup */}
      <div className="safety-mockup">
        <div className="safety-panel">
          <span className="safety-badge high">HIGH RISK — Bulk UPDATE</span>
          <div className="safety-sql">
            <span className="sql-kw">UPDATE</span> users <span className="sql-kw">SET</span> status{" "}
            = <span className="sql-str">&apos;inactive&apos;</span><br/>
            <span className="sql-kw">WHERE</span> last_login{" "}
            &lt; <span className="sql-str">&apos;2023-01-01&apos;</span>
          </div>
          <div className="safety-alert high">
            ⚠ HIGH RISK: 847 rows affected.<br/>OS PIN required to proceed.
          </div>
          <div className="pin-row">
            <div className="pin-box">_</div>
            <div className="pin-box">_</div>
            <div className="pin-box">_</div>
            <div className="pin-box">_</div>
          </div>
        </div>
        <div className="safety-panel">
          <span className="safety-badge critical">CRITICAL — Schema Migration</span>
          <div className="safety-sql">
            <span className="sql-kw">ALTER TABLE</span> orders<br/>
            <span className="sql-kw">ADD COLUMN</span> processed_at{" "}
            <span className="sql-kw">TIMESTAMP</span>
          </div>
          <div className="safety-alert critical">
            ⚠ CRITICAL: Schema modification detected.<br/>Verify carefully before proceeding.
          </div>
          <div className="safety-rollback">
            <span className="rb-label">Suggested Rollback</span>
            <span className="sql-kw">ALTER TABLE</span> orders<br/>
            <span className="sql-kw">DROP COLUMN</span> processed_at
          </div>
        </div>
      </div>

      <h2 id="static-ast-verification">Static AST Verification</h2>
      <p>
        Bollard uses the <code>sqlglot</code> parsing engine to generate an Abstract Syntax Tree (AST) of the query before it is passed to the database driver. This enables:
      </p>
      <ul>
        <li>
          <strong>Syntax Integrity</strong>: Rejects queries with malformed AST nodes before they touch the database.
        </li>
        <li>
          <strong>Intent Analysis</strong>: Decodes filters in the <code>WHERE</code> clause. If a query filters on a primary key column, it is classified as a single-row write (MEDIUM risk). If filters are missing or reference non-indexed columns, it is scored as a bulk write (HIGH risk).
        </li>
        <li>
          <strong>Forbidden Tables Blocklist</strong>: Verifies table references against wildcard patterns. Rejects requests at the AST parser level if matching table paths are found.
        </li>
      </ul>

      <h2 id="explain-plan-analysis">EXPLAIN Plan Analysis</h2>
      <p>
        Static checks are not always sufficient to determine query impact. Bollard runs a best-effort dry-run using the native database <code>EXPLAIN</code> protocol.
      </p>
      <ul>
        <li>
          <strong>Row Estimations</strong>: Retrieves row output predictions from the database planner. A write query that statically appears to target a single row but dynamically triggers updates across multiple rows due to cascades is upgraded to HIGH risk.
        </li>
        <li>
          <strong>Cost Warning Limits</strong>: Rejects or warns developers about queries whose estimated cost exceeds the threshold set by the <code>BOLLARD_DEFAULT_MAX_COST</code> environment variable. This prevents heavy, unindexed table scans on large production tables.
        </li>
      </ul>

      <h2 id="suggested-reversals">Suggested Reversals</h2>
      <p>
        For CRITICAL risk queries (such as schema alterations), Bollard attempts to construct the inverse SQL command statically from the AST structure. This shows the developer how to reverse the migration prior to execution.
      </p>
      
      <div className="callout warning">
        <div className="callout-title">Reversals are NOT Database Backups</div>
        <p>
          Suggested reversals only restore the database <strong>schema structure</strong>. They <strong>cannot restore deleted data</strong>. For example, if you run <code>DROP COLUMN score</code>, the suggested reversal is <code>ADD COLUMN score TEXT</code>. This creates an empty column; data recovery requires a database backup or snapshot.
        </p>
      </div>

      <h3>Supported Reversals</h3>
      <ul>
        <li>
          <code>ALTER TABLE users ADD COLUMN age INT;</code> targets <code>ALTER TABLE users DROP COLUMN age;</code>
        </li>
        <li>
          <code>ALTER TABLE users DROP COLUMN score;</code> targets <code>ALTER TABLE users ADD COLUMN score TEXT;</code> (shows data deletion warning)
        </li>
        <li>
          <code>ALTER TABLE users RENAME TO customers;</code> targets <code>ALTER TABLE customers RENAME TO users;</code>
        </li>
      </ul>
    </main>
  );
}
