import React from "react";

export default function SSLDocsPage() {
  return (
    <main className="content-body">
      <h1 id="ssl-and-cloud-policies">SSL & Cloud Database Policies</h1>
      <p>
        Cloud-hosted PostgreSQL database instances (such as Supabase, Neon, and AWS RDS) reject unencrypted traffic by default. This page documents Bollard's automated SSL handshake policy, trust fallback mechanism, and configuration mappings.
      </p>

      <h2 id="automatic-ssl-enforcement">1. Automatic SSL Enforcement</h2>
      <p>
        Rather than requiring developers to manually query and configure parameters like <code>sslmode=require</code>, Bollard inspects the target database connection string. If the host matches a known serverless cloud database provider domain, it enforces a secure context automatically.
      </p>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Cloud Provider</th>
              <th>Host Domain Pattern</th>
              <th>Default Mode</th>
              <th>Bollard Automated Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Supabase</strong></td>
              <td><code>*.supabase.co</code>, <code>*.supabase.red</code></td>
              <td><code>require</code></td>
              <td>Automatically appends <code>sslmode=require</code> for ports 5432 & 6543.</td>
            </tr>
            <tr>
              <td><strong>Neon</strong></td>
              <td><code>*.neon.tech</code></td>
              <td><code>require</code></td>
              <td>Enforces <code>sslmode=require</code> and auto-negotiates TLS protocol version.</td>
            </tr>
            <tr>
              <td><strong>Render</strong></td>
              <td><code>*.render.com</code></td>
              <td><code>require</code></td>
              <td>Appends <code>sslmode=require</code> to prevent handshake timeouts.</td>
            </tr>
            <tr>
              <td><strong>Railway</strong></td>
              <td><code>*.railway.app</code></td>
              <td><code>require</code></td>
              <td>Ensures secure handshake parameters on connection initialization.</td>
            </tr>
            <tr>
              <td><strong>AWS RDS</strong></td>
              <td><code>*.rds.amazonaws.com</code></td>
              <td><code>verify-full</code> (optional)</td>
              <td>Initiates secure TCP context, falls back safely to verify if requested.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="relaxed-ca-trust-fallback">2. Relaxed CA Trust Fallback</h2>
      <p>
        When connecting through corporate firewalls, local development proxies, or custom database configurations, you may encounter SSL certificate validation errors (such as <code>self-signed certificate in certificate chain</code> or <code>unable to get local issuer certificate</code>).
      </p>
      <div className="callout warning">
        <div className="callout-title">Validation Failure Interception</div>
        <p>
          Instead of crashing the active database adapter or disconnecting the agent daemon, Bollard catches SSL validation errors and securely renegotiates using a relaxed trust policy.
        </p>
      </div>
      <p>
        <strong>How it works</strong>: If a standard SSL handshake fails due to local trust chain validation (missing internal root CA), Bollard retries the connection after configuring the client driver to trust self-signed certs. This guarantees stable connectivity inside containerized dev systems without compromising the transport-layer encryption.
      </p>

      <h2 id="manual-ssl-overrides">3. Manual SSL Overrides</h2>
      <p>
        If your security policy requires verifying specific certificate authorities, you can append SSL settings directly to your connection URI. Bollard respects all driver-native parameters:
      </p>
      <ul>
        <li>
          <strong>Force strict verification</strong>: <code>postgresql://user:pass@host/db?sslmode=verify-full&sslrootcert=/path/to/server-ca.pem</code>
        </li>
        <li>
          <strong>Disable SSL entirely (Local development only)</strong>: <code>postgresql://user:pass@host/db?sslmode=disable</code>
        </li>
      </ul>
    </main>
  );
}
