"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((open) => !open);
      }
      if (e.key === "Escape") {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  React.useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const searchIndex = [
    // Getting Started
    {
      title: "Introduction",
      href: "/docs",
      category: "Getting Started",
      description: "Overview of Bollard Database MCP, its design philosophies, and key features.",
      keywords: ["getting started", "welcome", "bollard", "mcp", "overview", "installation", "database", "cursor", "vscode", "cline", "windsurf", "claude"]
    },
    {
      title: "Design Philosophies",
      href: "/docs#design-philosophies",
      category: "Getting Started",
      description: "Core tenets of Bollard: Safety-First, Contextual Awareness, Zero Trust, Client Autonomy.",
      keywords: ["philosophies", "principles", "security", "zero trust", "autonomy"]
    },
    {
      title: "Key Features",
      href: "/docs#key-features",
      category: "Getting Started",
      description: "Summary of safety metrics, compression, and developer integrations.",
      keywords: ["features", "capabilities", "what is", "highlights"]
    },
    {
      title: "Setup & Connections",
      href: "/docs/connections",
      category: "Getting Started",
      description: "How to connect Bollard to Supabase, Neon, Render, SQLite, MongoDB and configure environment variables.",
      keywords: ["setup", "installation", "configuration", "mcpServers", "env", "cursor", "vscode", "cline", "windsurf", "claude", "editor", "ide", "openai", "codex", "docker", "local"]
    },
    {
      title: "OpenAI Codex Integration",
      href: "/docs/connections#openai-codex",
      category: "Getting Started",
      description: "How to configure and register Bollard MCP with OpenAI Codex via CLI or config.toml.",
      keywords: ["openai", "codex", "config.toml", "setup", "register", "cli", "auth unsupported"]
    },
    {
      title: "Local Docker PostgreSQL Connection",
      href: "/docs/connections#local-docker-postgresql",
      category: "Getting Started",
      description: "How to connect Bollard to a local PostgreSQL database running in a Docker container.",
      keywords: ["docker", "local", "postgres", "seeding", "create_postgres_test_db.py", "dbcopilot"]
    },
    {
      title: "Environment Variables Reference",
      href: "/docs/connections#environment-variables",
      category: "Getting Started",
      description: "Configuration variables: BOLLARD_SERVER_NAME, BOLLARD_DEBUG, limits, timeouts, encryption keys.",
      keywords: ["env", "variables", "port", "timeout", "max rows", "credentials", "encryption"]
    },
    {
      title: "PgBouncer & Transaction Poolers",
      href: "/docs/connections#pgbouncer-and-poolers",
      category: "Getting Started",
      description: "How Bollard automatically handles transaction pooler prepared statement caching errors.",
      keywords: ["pgbouncer", "pooler", "supabase", "6543", "prepared statement", "asyncpg"]
    },
    {
      title: "Connection String Examples by Provider",
      href: "/docs/connections#connection-string-examples",
      category: "Getting Started",
      description: "Reference URLs for Supabase, Neon, Render, Railway, Turso (SQLite), and MongoDB Atlas.",
      keywords: ["connection string", "postgres url", "turso", "sqlite", "mongodb", "supabase", "neon", "docker", "local"]
    },
    {
      title: "SSL & Cloud Database Policies",
      href: "/docs/ssl",
      category: "Getting Started",
      description: "SSL connection requirements, automatic domain checking, and relaxed trust validation policies.",
      keywords: ["ssl", "tls", "security", "certificates", "cloud", "handshake"]
    },
    {
      title: "Automatic SSL Enforcement",
      href: "/docs/ssl#automatic-ssl-enforcement",
      category: "Getting Started",
      description: "Cloud database detection: automatically appending sslmode=require for Neon, Supabase, Render, Railway.",
      keywords: ["sslmode", "require", "automatic ssl", "rds", "neon", "supabase"]
    },
    {
      title: "Relaxed CA Trust Fallback",
      href: "/docs/ssl#relaxed-ca-trust-fallback",
      category: "Getting Started",
      description: "How Bollard catches local CA trust validation errors and renegotiates using a relaxed trust context.",
      keywords: ["self-signed", "ca", "certificate chain", "issuer", "validation error", "trust", "retry"]
    },
    {
      title: "Manual SSL Overrides",
      href: "/docs/ssl#manual-ssl-overrides",
      category: "Getting Started",
      description: "Explicitly force verify-full or disable SSL modes in database connection strings.",
      keywords: ["sslmode", "verify-full", "sslrootcert", "disable ssl"]
    },

    // Risk Governance
    {
      title: "Dynamic Risk Engine",
      href: "/docs/safety",
      category: "Risk Governance",
      description: "Scores the threat vector of SQL commands, dynamic risk levels (LOW to EXTREME), and friction policies.",
      keywords: ["risk", "threat", "safety", "governance", "validation"]
    },
    {
      title: "Risk Level Matrix",
      href: "/docs/safety#risk-level-matrix",
      category: "Risk Governance",
      description: "Triggers and friction gates applied for LOW, MEDIUM, HIGH, CRITICAL, and EXTREME risk commands.",
      keywords: ["matrix", "levels", "low", "medium", "high", "critical", "extreme", "friction", "pin"]
    },
    {
      title: "Static AST Verification",
      href: "/docs/safety#static-ast-verification",
      category: "Risk Governance",
      description: "How abstract syntax tree parsing verifies statement architecture before execution.",
      keywords: ["ast", "parsing", "sql", "static validation"]
    },
    {
      title: "EXPLAIN Plan Analysis",
      href: "/docs/safety#explain-plan-analysis",
      category: "Risk Governance",
      description: "Cost-estimation checking using database EXPLAIN plans to detect unindexed or high-cost updates.",
      keywords: ["explain", "cost", "query cost", "index", "estimation"]
    },
    {
      title: "Suggested Reversals & Rollbacks",
      href: "/docs/safety#suggested-reversals",
      category: "Risk Governance",
      description: "Automatic generation of SQL rollback proposals for CRITICAL or HIGH risk operations.",
      keywords: ["suggested reversal", "rollback", "undo", "sql revert", "safety migration"]
    },
    {
      title: "Write Gates & PINs",
      href: "/docs/gates",
      category: "Risk Governance",
      description: "Learn about friction gates, OS PIN validation, VS Code extension bridge, and administrative bypass.",
      keywords: ["pin", "friction", "vscode", "bypass", "terminal", "confirmation"]
    },
    {
      title: "Extension Bridge Connection",
      href: "/docs/gates#extension-bridge",
      category: "Risk Governance",
      description: "How the Bollard core server communicates with the active VS Code extension notification bridge.",
      keywords: ["extension", "vscode", "port", "extension bridge", "notification"]
    },

    // Context Optimization
    {
      title: "Smart Compression",
      href: "/docs/compression",
      category: "Context Optimization",
      description: "Token budget control via row aggregation, smart mode compression, and CSV exports.",
      keywords: ["compression", "tokens", "analytics", "raw", "csv", "context window", "smart mode"]
    },
    {
      title: "Token Math: Why Compression Matters",
      href: "/docs/compression#token-math",
      category: "Context Optimization",
      description: "Analysis of context window token reduction (up to 97% reduction) under Smart Mode.",
      keywords: ["token math", "latency", "cost", "mitigate hallucinations"]
    },
    {
      title: "Output Modes (Smart, Analytics, Raw)",
      href: "/docs/compression#output-modes",
      category: "Context Optimization",
      description: "Profiles: smart (sampling & aggregates), analytics (zero rows), raw (full dumps).",
      keywords: ["smart", "analytics", "raw", "output_mode"]
    },
    {
      title: "Automatic CSV Export",
      href: "/docs/compression#automatic-csv-export",
      category: "Context Optimization",
      description: "Saves compressed query records to a local workspace file accessible via client CSV links.",
      keywords: ["csv", "export", "local workspace", "file link"]
    },
    {
      title: "Database Profiler",
      href: "/docs/profiler",
      category: "Context Optimization",
      description: "Collects column profiles, row counts, and sample values safely to guide LLMs.",
      keywords: ["profiler", "columns", "aggregation", "schema", "indexes"]
    },
    {
      title: "AI Memory & History",
      href: "/docs/feedback",
      category: "Context Optimization",
      description: "How semantic rules, table exclusions, and query history guide agent correctness.",
      keywords: ["history", "corrections", "policies", "rules", "memory", "semantic"]
    },

    // API Reference / Dictionary
    {
      title: "API Reference Overview",
      href: "/docs/reference#api-reference",
      category: "API Dictionary",
      description: "Full directory of protocol tool endpoints provided by Bollard database server.",
      keywords: ["api reference", "tools", "mcp tools", "dictionary"]
    },
    {
      title: "Connection Tools",
      href: "/docs/reference#connection-tools",
      category: "API Dictionary",
      description: "Tools for managing active DB aliases: list_connections, add_connection, test_connection, remove_connection.",
      keywords: ["list_connections", "add_connection", "test_connection", "remove_connection", "alias"]
    },
    {
      title: "Schema Exploration Tools",
      href: "/docs/reference#schema-exploration-tools",
      category: "API Dictionary",
      description: "Tools to inspect structure: get_schema, list_tables, describe_table, search_schema.",
      keywords: ["get_schema", "list_tables", "describe_table", "search_schema", "columns", "foreign keys"]
    },
    {
      title: "Query Execution Tools",
      href: "/docs/reference#query-execution-tools",
      category: "API Dictionary",
      description: "Execute and explain tools: execute_query, explain_query.",
      keywords: ["execute_query", "explain_query", "sql", "output_mode", "transaction"]
    },
    {
      title: "Table Profiler Tools",
      href: "/docs/reference#table-profiler-tools",
      category: "API Dictionary",
      description: "Tools for statistics: get_table_profile, get_column_stats.",
      keywords: ["get_table_profile", "get_column_stats", "null count", "min max", "variance"]
    },
    {
      title: "Feedback & Corrections",
      href: "/docs/reference#feedback-and-corrections",
      category: "API Dictionary",
      description: "Tools for AI guidelines: add_correction, list_corrections, remove_correction.",
      keywords: ["add_correction", "list_corrections", "remove_correction", "rules", "guidelines"]
    },
    {
      title: "MCP Resource Endpoints Reference",
      href: "/docs/reference#mcp-resource-endpoints",
      category: "API Dictionary",
      description: "Bollard resource URIs: bollard://connections, bollard://schema, bollard://history, bollard://corrections.",
      keywords: ["resource", "endpoints", "bollard://connections", "bollard://schema", "bollard://history"]
    }
  ];

  const filteredResults = searchQuery.trim() === ""
    ? searchIndex.slice(0, 3) // Suggested Pages
    : searchIndex.filter(item => {
        const query = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.keywords.some(k => k.includes(query))
        );
      });

  const handleItemClick = () => {
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  const menuItems = [
    {
      category: "Getting Started",
      items: [
        { title: "Introduction", href: "/docs" },
        { title: "Setup & Connections", href: "/docs/connections" },
        { title: "SSL Connection Policies", href: "/docs/ssl" },
      ],
    },
    {
      category: "Risk Governance",
      items: [
        { title: "Dynamic Risk Engine", href: "/docs/safety" },
        { title: "Write Gates & PINs", href: "/docs/gates" },
      ],
    },
    {
      category: "Context Optimization",
      items: [
        { title: "Smart Compression", href: "/docs/compression" },
        { title: "Database Profiler", href: "/docs/profiler" },
        { title: "AI Memory & History", href: "/docs/feedback" },
      ],
    },
    {
      category: "API Dictionary",
      items: [
        { title: "API Reference", href: "/docs/reference" },
      ],
    },
  ];

  // Breadcrumbs mapping
  const breadcrumbsMap: Record<string, string[]> = {
    "/docs": ["Getting Started", "Introduction"],
    "/docs/connections": ["Getting Started", "Setup & Connections"],
    "/docs/ssl": ["Getting Started", "SSL Connection Policies"],
    "/docs/safety": ["Risk Governance", "Dynamic Risk Engine"],
    "/docs/gates": ["Risk Governance", "Write Gates & PINs"],
    "/docs/compression": ["Context Optimization", "Smart Compression"],
    "/docs/profiler": ["Context Optimization", "Database Profiler"],
    "/docs/feedback": ["Context Optimization", "AI Memory & History"],
    "/docs/reference": ["API Dictionary", "API Reference"],
  };

  const breadcrumbs = breadcrumbsMap[pathname] || ["Docs"];

  // Table of Contents mapping
  const tocMap: Record<string, { title: string; href: string }[]> = {
    "/docs": [
      { title: "Introduction", href: "#introduction" },
      { title: "Key Features", href: "#key-features" },
      { title: "Design Philosophies", href: "#design-philosophies" },
    ],
    "/docs/connections": [
      { title: "Installation", href: "#installation" },
      { title: "Configuring the Editor", href: "#configuring-the-editor" },
      { title: "Environment Variables", href: "#environment-variables" },
      { title: "PgBouncer & Poolers", href: "#pgbouncer-and-poolers" },
      { title: "Connection String Examples", href: "#connection-string-examples" },
    ],
    "/docs/ssl": [
      { title: "Automatic SSL Enforcement", href: "#automatic-ssl-enforcement" },
      { title: "Relaxed CA Trust Fallback", href: "#relaxed-ca-trust-fallback" },
      { title: "Manual SSL Overrides", href: "#manual-ssl-overrides" },
    ],
    "/docs/safety": [
      { title: "Threat Vector Model", href: "#threat-vector-model" },
      { title: "Permission Modes", href: "#permission-modes" },
      { title: "Risk Level Matrix", href: "#risk-level-matrix" },
      { title: "Static AST Verification", href: "#static-ast-verification" },
      { title: "EXPLAIN Plan Analysis", href: "#explain-plan-analysis" },
      { title: "Suggested Reversals", href: "#suggested-reversals" },
    ],
    "/docs/gates": [
      { title: "Friction Gates", href: "#friction-gates" },
      { title: "PIN Generation Flow", href: "#pin-generation-flow" },
      { title: "Extension Bridge", href: "#extension-bridge" },
      { title: "Terminal Bypass", href: "#terminal-bypass" },
      { title: "Admin Mode Override", href: "#admin-mode-override" },
    ],
    "/docs/compression": [
      { title: "Context Compression", href: "#context-compression" },
      { title: "Token Math", href: "#token-math" },
      { title: "Output Modes", href: "#output-modes" },
      { title: "Automatic CSV Export", href: "#automatic-csv-export" },
    ],
    "/docs/profiler": [
      { title: "Database Profiler", href: "#database-profiler" },
      { title: "Pushed Aggregations", href: "#pushed-aggregations" },
      { title: "Metrics Gathered", href: "#metrics-gathered" },
      { title: "Security Enforcement", href: "#security-enforcement" },
    ],
    "/docs/feedback": [
      { title: "AI Memory & History", href: "#ai-memory-and-history" },
      { title: "Corrections Loop", href: "#corrections-loop" },
      { title: "Query History", href: "#query-history" },
      { title: "MCP Resources", href: "#mcp-resources" },
    ],
    "/docs/reference": [
      { title: "API Reference", href: "#api-reference" },
      { title: "Connection Tools", href: "#connection-tools" },
      { title: "Schema Exploration Tools", href: "#schema-exploration-tools" },
      { title: "Query Execution Tools", href: "#query-execution-tools" },
      { title: "Table Profiler Tools", href: "#table-profiler-tools" },
      { title: "Feedback & Corrections", href: "#feedback-and-corrections" },
      { title: "MCP Resource Endpoints", href: "#mcp-resource-endpoints" },
    ],
  };

  const activeToc = tocMap[pathname] || [];

  return (
    <div className="layout-wrapper">
      {/* Navigation Header */}
      <header className="header">
        <button
          className="mobile-menu-btn"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label="Toggle menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {isSidebarOpen ? (
              <path d="M18 6 6 18M6 6l12 12" />
            ) : (
              <path d="M4 12h16M4 6h16M4 18h16" />
            )}
          </svg>
        </button>
        <Link href="/" className="logo-section">
          <img
            src="/images/bollard_final_logo.png"
            alt="Bollard Logo"
            className="logo-image"
          />
          <span>Bollard Docs</span>
        </Link>
        <div className="search-wrapper" onClick={() => setIsSearchOpen(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <span>Search docs...</span>
          <span style={{ marginLeft: "auto", fontSize: "0.7rem", color: "var(--text-dark)", background: "#111111", padding: "2px 5px", borderRadius: "3px", border: "1px solid #1f1f1f" }}>
            Ctrl+K
          </span>
        </div>
        <nav className="nav-links">
          <Link href="/docs" className="nav-link active">
            Documentation
          </Link>
          <Link href="/enterprise" className="nav-link">
            Enterprise
          </Link>
          <a
            href="https://github.com/Bollard-db/Bollard"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-link"
          >
            GitHub
          </a>
        </nav>
      </header>

      {/* Interactive Search Modal */}
      {isSearchOpen && (
        <div className="search-modal-backdrop" onClick={() => setIsSearchOpen(false)}>
          <div className="search-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="search-modal-header">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                className="search-modal-input"
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="search-modal-close-hint">ESC</span>
            </div>
            <div className="search-modal-body">
              <div className="search-results-label">
                {searchQuery.trim() === "" ? "Suggested Pages" : "Search Results"}
              </div>
              {filteredResults.length === 0 ? (
                <div className="search-no-results">No results found for "{searchQuery}"</div>
              ) : (
                <ul className="search-results-list">
                  {filteredResults.map((item, index) => (
                    <li key={index}>
                      <Link href={item.href} className="search-result-item" onClick={handleItemClick}>
                        <div className="search-result-category">{item.category}</div>
                        <div className="search-result-title">{item.title}</div>
                        <div className="search-result-desc">{item.description}</div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="main-content">
        {isSidebarOpen && (
          <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)} />
        )}
        {/* Sidebar Navigation */}
        <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
          {menuItems.map((cat, idx) => (
            <div key={idx} className="sidebar-category">
              <h4 className="sidebar-title">{cat.category}</h4>
              <ul className="sidebar-list">
                {cat.items.map((item, itemIdx) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={itemIdx} className="sidebar-item">
                      <Link
                        href={item.href}
                        className={`sidebar-link ${isActive ? "active" : ""}`}
                      >
                        {item.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </aside>

        {/* Page Content Body */}
        <div className="content-body">
          {/* Breadcrumbs */}
          <div className="breadcrumbs">
            <span>Docs</span>
            {breadcrumbs.map((crumb, cIdx) => (
              <React.Fragment key={cIdx}>
                <span className="separator">/</span>
                <span>{crumb}</span>
              </React.Fragment>
            ))}
          </div>
          {children}
        </div>

        {/* Dynamic Table of Contents Sidebar */}
        {activeToc.length > 0 && (
          <aside className="toc-panel">
            <h4 className="toc-title">On this page</h4>
            <ul className="toc-list">
              {activeToc.map((item, tIdx) => (
                <li key={tIdx} className="toc-item">
                  <a href={item.href} className="toc-link">
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </div>
  );
}
