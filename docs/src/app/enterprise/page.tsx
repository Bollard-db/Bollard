import React from "react";
import Link from "next/link";

export default function EnterprisePage() {
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
          <Link href="/enterprise" className="lh-nav-link active">
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
            <span className="hero-badge">Bollard Enterprise</span>
          </div>
          <h1 className="hero-title">
            Enterprise SQL Safety for <span className="highlight">AI Environments</span>
          </h1>
          <p className="hero-subtitle">
            Scale database execution for AI agents safely. Bollard Enterprise provides VPC self-hosting, compliance auditing, custom authorization bridges, and dedicated SLA priority support.
          </p>

          <div className="hero-ctas">
            <a href="mailto:pavakstudio@gmail.com" className="btn btn-primary">
              Contact Sales
            </a>
            <Link href="/docs" className="btn btn-outline">
              Read Developer Docs
            </Link>
          </div>
        </section>

        {/* Enterprise Capabilities Grid */}
        <section className="features-section">
          <h2 className="section-title">Production Guardrails for Teams</h2>
          <p className="section-desc">
            Keep database integrity intact and query execution compliance airtight across your enterprise.
          </p>

          <div className="features-grid">
            <div className="f-card">
              <div className="f-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                  <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"></path>
                </svg>
              </div>
              <h3 className="f-card-title">VPC Self-Hosting</h3>
              <p className="f-card-desc">
                Deploy Bollard completely isolated within your AWS, GCP, or Azure private network. Secure sensitive credentials locally and run zero-egress environments.
              </p>
            </div>

            <div className="f-card">
              <div className="f-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h3 className="f-card-title">SSO & Auth Bridges</h3>
              <p className="f-card-desc">
                Integrate dynamic write gates with corporate directory services (Okta, Entra ID, Ping Identity). Verify agent PINs directly through custom multi-factor channels.
              </p>
            </div>

            <div className="f-card">
              <div className="f-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
              <h3 className="f-card-title">Compliance Auditing</h3>
              <p className="f-card-desc">
                Stream comprehensive execution histories, risk levels, rollback proposals, and verification timelines into internal logging platforms like Splunk or Datadog.
              </p>
            </div>

            <div className="f-card">
              <div className="f-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <h3 className="f-card-title">Priority SLAs</h3>
              <p className="f-card-desc">
                Get access to a dedicated channels for 24/7 incident response, architecture audits, performance tuning support, and custom feature developments.
              </p>
            </div>
          </div>
        </section>

        {/* Commercial Licensing Details */}
        <section className="cta-banner">
          <h2 className="banner-title">Dual-Licensing Structure</h2>
          <p className="banner-desc">
            Bollard is licensed under the AGPL-3.0 for open-source development and local prototyping. For commercial SaaS deployments, internal business tools, or proprietary distributions, contact us for commercial licensing terms.
          </p>
          <div className="banner-buttons">
            <a href="mailto:pavakstudio@gmail.com" className="btn btn-primary">
              Request Commercial License
            </a>
            <a href="mailto:pavakstudio@gmail.com" className="btn btn-outline">
              Email Sales Team
            </a>
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
