import Link from "next/link";

export default function Home() {
  return (
    <div className="landing">
      {/* Nav */}
      <nav className="nav">
        <div className="nav-inner">
          <span className="logo">
            <span className="logo-bracket">[</span>valify<span className="logo-bracket">]</span>
          </span>
          <div className="nav-links">
            <Link href="/login" className="btn-ghost">Se connecter</Link>
            <Link href="/register" className="btn-primary">S&apos;inscrire</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-inner">
          <div className="hero-badge">API-first · LLM validation</div>
          <h1 className="hero-title">
            Validez chaque<br />
            <span className="hero-accent">message utilisateur</span><br />
            avant qu&apos;il parte.
          </h1>
          <p className="hero-sub">
            Configurez des règles, un schéma JSON, et appelez une seule route.<br />
            Le LLM fait le reste. Zéro prompt engineering côté client.
          </p>
          <div className="hero-cta">
            <Link href="/register" className="btn-primary btn-lg">Démarrer gratuitement</Link>
            <Link href="/login" className="btn-outline btn-lg">Voir la démo</Link>
          </div>
          <div className="hero-code">
            <span className="code-label">POST</span>
            <code>/api/v1/validate/:call_id</code>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="features-inner">
          <div className="feature-card">
            <div className="feature-icon">01</div>
            <h3 className="feature-title">Calls configurables</h3>
            <p className="feature-desc">
              Créez des &quot;calls&quot; avec vos règles de validation, un schéma de sortie JSON,
              et un prompt système. Réutilisables à l&apos;infini.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">02</div>
            <h3 className="feature-title">Une seule route API</h3>
            <p className="feature-desc">
              Envoyez le message de votre utilisateur. Recevez un JSON structuré
              conforme à votre schéma. Pas de prompt côté client.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">03</div>
            <h3 className="feature-title">Multi-tenant</h3>
            <p className="feature-desc">
              Isolation par organisation. Tokens API hashés bcrypt.
              Gestion des membres et des droits intégrée.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">04</div>
            <h3 className="feature-title">Historique & logs</h3>
            <p className="feature-desc">
              Chaque appel est tracé. Consultez les résultats, déboguez
              les rejets, analysez l&apos;usage par call.
            </p>
          </div>
        </div>
      </section>

      {/* CTA bottom */}
      <section className="cta-section">
        <div className="cta-inner">
          <h2 className="cta-title">Prêt à valider vos prompts ?</h2>
          <Link href="/register" className="btn-primary btn-lg">Créer un compte</Link>
        </div>
      </section>

      <footer className="footer">
        <span className="logo">
          <span className="logo-bracket">[</span>valify<span className="logo-bracket">]</span>
        </span>
        <span className="footer-copy">© 2026 Valify</span>
      </footer>

      <style>{`
        /* Reset & base */
        .landing {
          min-height: 100vh;
          background: #0a0a0f;
          color: #e8e8f0;
          font-family: 'DM Sans', 'Helvetica Neue', Arial, sans-serif;
        }

        /* Nav */
        .nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(10,10,15,0.85);
          backdrop-filter: blur(12px);
        }
        .nav-inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 2rem;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .logo {
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 1.1rem;
          font-weight: 600;
          letter-spacing: -0.02em;
          color: #e8e8f0;
        }
        .logo-bracket {
          color: #4f8ef7;
        }
        .nav-links {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        /* Buttons */
        .btn-ghost {
          padding: 0.4rem 1rem;
          border-radius: 4px;
          font-size: 0.875rem;
          color: #a0a0b8;
          text-decoration: none;
          transition: color 0.15s;
        }
        .btn-ghost:hover { color: #e8e8f0; }

        .btn-primary {
          padding: 0.4rem 1rem;
          border-radius: 4px;
          font-size: 0.875rem;
          font-weight: 500;
          background: #4f8ef7;
          color: #fff;
          text-decoration: none;
          transition: background 0.15s;
        }
        .btn-primary:hover { background: #3a7de0; }

        .btn-outline {
          padding: 0.4rem 1rem;
          border-radius: 4px;
          font-size: 0.875rem;
          font-weight: 500;
          border: 1px solid rgba(255,255,255,0.15);
          color: #e8e8f0;
          text-decoration: none;
          transition: border-color 0.15s, background 0.15s;
        }
        .btn-outline:hover {
          border-color: rgba(255,255,255,0.3);
          background: rgba(255,255,255,0.04);
        }

        .btn-lg {
          padding: 0.65rem 1.5rem;
          font-size: 0.95rem;
        }

        /* Hero */
        .hero {
          position: relative;
          padding: 10rem 2rem 6rem;
          overflow: hidden;
        }
        .hero-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(79,142,247,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(79,142,247,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%);
        }
        .hero-inner {
          position: relative;
          max-width: 1100px;
          margin: 0 auto;
        }
        .hero-badge {
          display: inline-block;
          margin-bottom: 1.5rem;
          padding: 0.25rem 0.75rem;
          border: 1px solid rgba(79,142,247,0.3);
          border-radius: 2px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.7rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #4f8ef7;
          background: rgba(79,142,247,0.06);
        }
        .hero-title {
          font-size: clamp(2.5rem, 6vw, 4.5rem);
          font-weight: 700;
          line-height: 1.05;
          letter-spacing: -0.03em;
          margin: 0 0 1.5rem;
          color: #f0f0fa;
        }
        .hero-accent {
          color: #4f8ef7;
        }
        .hero-sub {
          font-size: 1.1rem;
          line-height: 1.7;
          color: #7070a0;
          max-width: 540px;
          margin: 0 0 2.5rem;
        }
        .hero-cta {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-bottom: 3rem;
        }
        .hero-code {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 1rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 4px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.85rem;
          color: #9090b8;
        }
        .code-label {
          padding: 0.1rem 0.4rem;
          background: rgba(79,142,247,0.15);
          color: #4f8ef7;
          border-radius: 2px;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.05em;
        }

        /* Features */
        .features {
          padding: 4rem 2rem 6rem;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .features-inner {
          max-width: 1100px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.06);
        }
        .feature-card {
          background: #0a0a0f;
          padding: 2rem;
          transition: background 0.2s;
        }
        .feature-card:hover {
          background: rgba(79,142,247,0.04);
        }
        .feature-icon {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.75rem;
          font-weight: 700;
          color: #4f8ef7;
          letter-spacing: 0.1em;
          margin-bottom: 1rem;
          opacity: 0.7;
        }
        .feature-title {
          font-size: 1rem;
          font-weight: 600;
          color: #e8e8f0;
          margin: 0 0 0.75rem;
          letter-spacing: -0.01em;
        }
        .feature-desc {
          font-size: 0.875rem;
          line-height: 1.65;
          color: #6060a0;
          margin: 0;
        }

        /* CTA bottom */
        .cta-section {
          padding: 5rem 2rem;
          border-top: 1px solid rgba(255,255,255,0.06);
          text-align: center;
        }
        .cta-inner {
          max-width: 500px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }
        .cta-title {
          font-size: 1.75rem;
          font-weight: 700;
          letter-spacing: -0.03em;
          color: #f0f0fa;
          margin: 0;
        }

        /* Footer */
        .footer {
          padding: 1.5rem 2rem;
          border-top: 1px solid rgba(255,255,255,0.06);
          max-width: 1100px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .footer-copy {
          font-size: 0.8rem;
          color: #3a3a5a;
        }

        @media (max-width: 640px) {
          .hero { padding: 8rem 1.25rem 4rem; }
          .features { padding: 3rem 1.25rem 4rem; }
          .nav-inner { padding: 0 1.25rem; }
          .footer { padding: 1.5rem 1.25rem; flex-direction: column; gap: 0.5rem; text-align: center; }
        }
      `}</style>
    </div>
  );
}
