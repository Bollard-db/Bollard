import React from "react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="landing-wrapper">
      {/* Background Radial Glow */}
      <div className="landing-glow" />
      <div className="landing-glow secondary" />

      {/* Floating Header */}
      <header className="landing-header">
        <div className="lh-logo">
          <img
            src="/images/bollard_final_logo.png"
            alt="Bollard Logo"
            className="lh-logo-img"
          />
          <span className="lh-logo-text">Bollard</span>
        </div>
        <nav className="lh-nav">
          <Link href="/docs" className="lh-nav-link">
            Docs
          </Link>
          <Link href="/docs/connections" className="lh-nav-link">
            Setup
          </Link>
          <Link href="/enterprise" className="lh-nav-link">
            Enterprise
          </Link>
          <Link href="/docs/reference" className="lh-nav-link">
            API Reference
          </Link>
          <a
            href="https://github.com/Bollard-db/Bollard"
            target="_blank"
            rel="noopener noreferrer"
            className="lh-nav-link github"
          >
            GitHub
          </a>
        </nav>
      </header>

      {/* Main Content */}
      <main className="landing-content">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="badge-container">
            <span className="hero-badge">Model Context Protocol</span>
          </div>
          <h1 className="hero-title">
            SQL Safety Gateway for <span className="highlight">AI Agents</span>
          </h1>
          <p className="hero-subtitle">
            Secure, validate, profile, and compress database executions. Bollard is an enterprise-grade safety gateway that stops destructive operations and fits large query results into small LLM context windows.
          </p>

          <div className="hero-ctas">
            <Link href="/docs" className="btn btn-primary">
              Get Started
            </Link>
            <a
              href="https://github.com/Bollard-db/Bollard"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
            >
              Star on GitHub
            </a>
          </div>

          {/* Interactive Terminal Mockup */}
          <div className="terminal-mock">
            <div className="terminal-header">
              <span className="dot red" />
              <span className="dot yellow" />
              <span className="dot green" />
              <span className="terminal-title">bash — bollard-mcp run</span>
            </div>
            <div className="terminal-body">
              <div className="line command">
                <span className="prompt">$</span> pip install bollard-mcp
              </div>
              <div className="line success-line">
                Installed bollard-mcp v0.1.2 successfully.
              </div>
              <div className="line command">
                <span className="prompt">$</span> bollard-mcp run --db neon
              </div>
              <div className="line info-line">
                [Bollard] Initializing connection to Neon Serverless Database...
              </div>
              <div className="line info-line">
                [Bollard] SSL auto-enforced (sslmode=require)
              </div>
              <div className="line info-line">
                [Bollard] Dynamic risk validation engine armed.
              </div>
              <div className="line info-line">
                [Bollard] Local write gates enabled on port 5567 (Awaiting PIN validations).
              </div>
              <div className="line success-line highlight-line">
                [Bollard] MCP Server active and listening over stdio!
              </div>
            </div>
          </div>
        </section>

        {/* Pipeline Diagram Section */}
        <section className="pipeline-section">
          <h2 className="section-title">The Secure Execution Pipeline</h2>
          <p className="section-desc">
            Bollard sits securely between your LLM editor client and your database, screening threat vectors in real-time.
          </p>

          <div className="pipeline-diagram">
            <div className="p-step">
              <div className="p-step-badge">AI Agent</div>
              <div className="p-step-text">Generates SQL execution request</div>
            </div>
            <div className="p-arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>
            <div className="p-step highlight">
              <div className="p-step-badge">Bollard Gateway</div>
              <div className="p-step-text">Parses AST, checks EXPLAIN cost, requires OS PIN if write risk high</div>
            </div>
            <div className="p-arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>
            <div className="p-step">
              <div className="p-step-badge">Database</div>
              <div className="p-step-text">Executes verified, safe SQL code</div>
            </div>
            <div className="p-arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>
            <div className="p-step highlight">
              <div className="p-step-badge">Optimizer</div>
              <div className="p-step-text">Compresses tables by up to 97% to fit token budgets</div>
            </div>
          </div>
        </section>

        {/* Feature Grid Section */}
        <section className="features-section">
          <h2 className="section-title">Designed for Zero-Trust Autonomy</h2>
          <p className="section-desc">
            Advanced guardrails that keep your database intact, your costs predictable, and your agent context windows lightweight.
          </p>

          <div className="features-grid">
            <div className="f-card">
              <div className="f-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <h3 className="f-card-title">Dynamic Risk Engine</h3>
              <p className="f-card-desc">
                Parses queries into Abstract Syntax Trees (AST) and checks query plan complexity using EXPLAIN analysis before executing statements.
              </p>
            </div>

            <div className="f-card">
              <div className="f-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                </svg>
              </div>
              <h3 className="f-card-title">Friction Write Gates</h3>
              <p className="f-card-desc">
                Prompts for secondary verification pins using desktop OS hooks and browser/editor modals before allowing write, drop, or alter queries.
              </p>
            </div>

            <div className="f-card">
              <div className="f-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7" />
                </svg>
              </div>
              <h3 className="f-card-title">Context Optimizer</h3>
              <p className="f-card-desc">
                Token budgeting via smart rows aggregation, sampling tables, and exporting full tables as auto-downloadable workspace CSV links.
              </p>
            </div>

            <div className="f-card">
              <div className="f-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 11 2 2 4-4" />
                </svg>
              </div>
              <h3 className="f-card-title">SSL Trust Negotiation</h3>
              <p className="f-card-desc">
                Detects cloud targets (Supabase, Neon, AWS RDS) and auto-configures SSL connection policies. Handles local self-signed CA fallbacks gracefully.
              </p>
            </div>
          </div>
        </section>

        {/* Call-to-Action Banner */}
        <section className="cta-banner">
          <h2 className="banner-title">Ready to secure your AI databases?</h2>
          <p className="banner-desc">
            Get started in under 60 seconds with our pip package module or configure your custom server configurations.
          </p>
          <div className="banner-buttons">
            <Link href="/docs" className="btn btn-primary">
              Read the Guides
            </Link>
            <Link href="/docs/connections" className="btn btn-outline">
              Setup Connection
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <p>&copy; {new Date().getFullYear()} Bollard Database MCP. All rights reserved.</p>
        <div className="lf-links">
          <a
            href="https://github.com/Bollard-db/Bollard"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <Link href="/docs">Documentation</Link>
          <Link href="/enterprise">Enterprise</Link>
          <Link href="/docs/reference">API Reference</Link>
        </div>
      </footer>
    </div>
  );
}
