import React from "react";

export default function IntroPage() {
  return (
    <main className="content-body">
      <h1 id="introduction">Introduction</h1>
      <p>
        Bollard is an enterprise-grade SQL execution safety gateway and AI context optimizer.
        It functions as a secure bridge between client AI agents (such as Cursor, VS Code, and Claude) and
        production SQL databases, guaranteeing safe execution environments while maximizing context-window efficiency.
      </p>

      <p>
        Instead of acting as a simple, passive query gateway, Bollard actively intercepts SQL statements,
        evaluates their risk level statically using AST analysis, compresses large outputs into lean summaries to
        save context tokens, and provides human-in-the-loop validation for potentially risky write operations.
      </p>

      {/* Architecture Flow Diagram */}
      <div className="diagram-wrap">
        <div className="diagram-header">Query Execution Pipeline</div>
        <div className="arch-flow">
          <div className="arch-node cyan">Client AI<br/>Agent</div>
          <span className="arch-arr">→<small>stdio</small></span>
          <div className="arch-node">Bollard<br/>MCP Server</div>
          <span className="arch-arr">→</span>
          <div className="arch-group">
            <div className="arch-node">AST Parser</div>
            <div className="arch-node">EXPLAIN Validator</div>
          </div>
          <span className="arch-arr">→</span>
          <div className="arch-node">Connection<br/>Policy</div>
          <span className="arch-arr">→</span>
          <div className="arch-node">DB Engine</div>
          <span className="arch-arr">→</span>
          <div className="arch-node amber">Context<br/>Compressor<small>CSV + 10-row preview</small></div>
          <span className="arch-arr">→</span>
          <div className="arch-node green">Markdown<br/>Response</div>
        </div>
      </div>

      <h2 id="key-features">Key Features</h2>
      <div className="feature-grid">
        <div className="feature-card">
          <h3>Dynamic Risk Engine</h3>
          <p>
            Statically parses incoming SQL queries and combines estimates from DB explain plans to assign a risk tier (LOW, MEDIUM, HIGH, CRITICAL, EXTREME) before execution is permitted.
          </p>
        </div>
        <div className="feature-card">
          <h3>Human-in-the-Loop Gates</h3>
          <p>
            Write operations that exceed a risk threshold trigger a gated authorization flow. A native desktop notification delivers a one-time security PIN to your editor extension, requiring physical human approval.
          </p>
        </div>
        <div className="feature-card">
          <h3>Smart Context Compression</h3>
          <p>
            Large query outputs exceeding 15 rows are automatically compressed into a structured summary block containing a 10-row preview and column statistics, reducing LLM token usage by up to 97%.
          </p>
        </div>
        <div className="feature-card">
          <h3>Semantic Memory Loop</h3>
          <p>
            Developer corrections (such as deprecated column mappings or business logic rules) are persisted locally and injected into the AI agent&apos;s context window at session start.
          </p>
        </div>
      </div>

      <h2 id="how-it-works">How It Works</h2>
      <p>
        Bollard is designed to work as a transparent intermediary layer between the AI agent and the database. When you connect an AI client (e.g. Cursor, VS Code, or Codex) to your database via Bollard, the MCP server becomes the sole execution gateway. All database interactions are routed through the server, which applies safety validations and context optimizations before returning a response to the AI.
      </p>

      <h3>Before Bollard vs. With Bollard</h3>
      <p>
        Adding Bollard transforms how your AI development agent interacts with your database:
      </p>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Workflow Aspect</th>
              <th>Before Bollard (Direct SQL Assistant)</th>
              <th>With Bollard (Safe Database Gateway)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Schema Context</strong></td>
              <td>Relies on manually pasted schema blocks, leading to hallucinated queries on outdated schemas.</td>
              <td>Inspects schemas dynamically, caching metadata and profiles to feed the LLM accurate context.</td>
            </tr>
            <tr>
              <td><strong>Execution Safety</strong></td>
              <td>AI directly runs generated queries. High risk of accidental data modification, deletion, or drops.</td>
              <td>Risk levels (LOW to EXTREME) are computed statically. Destructive operations are safely blocked.</td>
            </tr>
            <tr>
              <td><strong>Human-in-the-Loop</strong></td>
              <td>None. Large batch updates or structural migrations execute immediately without warnings.</td>
              <td>Write queries require double confirmation (confirming query matching phrases and typing local PINs).</td>
            </tr>
            <tr>
              <td><strong>Data Leak Prevention</strong></td>
              <td>AI can query any table, including sensitive tables (e.g., password hashes, user secrets, API keys).</td>
              <td>Access control lists block sensitive tables via connection-level blocklist wildcards.</td>
            </tr>
            <tr>
              <td><strong>Token &amp; Context Usage</strong></td>
              <td>Large queries return massive raw rows, flooding the context window and wasting thousands of tokens.</td>
              <td>Large queries are compressed into structured summaries with a 10-row preview and column stats (up to 97% token savings).</td>
            </tr>
            <tr>
              <td><strong>Correction Loop</strong></td>
              <td>No memory of past mistakes. AI repeats the same syntax/query errors in new sessions.</td>
              <td>Custom fixes and deprecated field overrides are persisted and auto-injected as agent instructions.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  );
}
