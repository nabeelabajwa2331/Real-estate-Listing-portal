import { Link } from 'react-router-dom';

const points = [
  ['Verified listings', 'Every property is reviewed before it goes live.'],
  ['Direct contact', 'Message agents and keep every conversation in one place.'],
  ['Save and compare', 'Keep favorites and searches ready for later.'],
];

// Shared two-column shell for the sign-in and registration pages. On wide
// screens the brand story sits on the left and the form on the right; on
// phones the story collapses into a compact header above the form.
export default function AuthShell({
  eyebrow = "Pakistan's property portal",
  title,
  subtitle,
  asideTitle = 'Find a place that feels like home.',
  asideText = 'Verified listings, local agents and a simple way to move — all in one place.',
  action,
  footer,
  children,
}) {
  return (
    <section className="auth-page">
      <div className="auth-shell">
        <aside className="auth-aside">
          <Link to="/" className="auth-brand">
            <span className="brand-mark" aria-hidden="true">
              RE
            </span>
            <span>RealEstate</span>
          </Link>

          <div className="auth-aside-body">
            <span className="auth-eyebrow">{eyebrow}</span>
            <h2>{asideTitle}</h2>
            <p>{asideText}</p>

            <ul className="auth-points">
              {points.map(([pointTitle, pointText]) => (
                <li key={pointTitle}>
                  <span className="auth-point-check" aria-hidden="true">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m4 12 5 5L20 6" />
                    </svg>
                  </span>
                  <div>
                    <strong>{pointTitle}</strong>
                    <span>{pointText}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <p className="auth-aside-foot">Pakistan-wide listings · Local agents · Direct messaging</p>
        </aside>

        <div className="auth-panel">
          <div className="auth-panel-head">
            <div>
              <h1>{title}</h1>
              {subtitle && <p className="muted small">{subtitle}</p>}
            </div>
            {action}
          </div>

          {children}

          {footer && <div className="auth-panel-foot">{footer}</div>}
        </div>
      </div>
    </section>
  );
}
