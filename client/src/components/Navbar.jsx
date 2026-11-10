import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import Avatar from './Avatar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useFavorites } from '../context/FavoritesContext.jsx';
import { useInquiries } from '../context/InquiryContext.jsx';
import { useChat } from '../context/ChatContext.jsx';

const roleLabel = { admin: 'Administrator', agent: 'Agent', user: 'Member' };

const iconProps = {
  width: 17,
  height: 17,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

const icons = {
  heart: (
    <svg {...iconProps}>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  ),
  message: (
    <svg {...iconProps}>
      <path d="M21 12a8 8 0 0 1-8 8H6l-3 2 1-5a8 8 0 1 1 17-5z" />
    </svg>
  ),
  shield: (
    <svg {...iconProps}>
      <path d="M12 2l7 4v6c0 5-3 8-7 10-4-2-7-5-7-10V6z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  building: (
    <svg {...iconProps}>
      <path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
      <path d="M16 9h2a2 2 0 0 1 2 2v10" />
      <path d="M8 7h4M8 11h4M8 15h4M8 19h4" />
    </svg>
  ),
  grid: (
    <svg {...iconProps}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  close: (
    <svg {...iconProps}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  ),
};

// The primary destination belongs to the role. Admins land on the admin
// dashboard; members and agents keep their own workspace entry points.
const dashboardLink = {
  admin: { to: '/admin', label: 'Admin dashboard', icon: icons.shield },
  agent: { to: '/agent', label: 'My listings', icon: icons.building },
  user: { to: '/dashboard', label: 'Dashboard', icon: icons.grid },
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count: savedCount } = useFavorites();
  const { unread } = useInquiries();
  const { unread: chatUnread } = useChat();
  const messagesUnread = unread + chatUnread;
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const isAuthRoute =
    ['/login', '/register', '/forgot-password'].includes(location.pathname) ||
    location.pathname.startsWith('/reset-password');

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Escape closes the menu for keyboard users, and the page behind the open
  // mobile panel must not scroll underneath it.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  // Auth screens carry their own brand header, so the global navigation would
  // only repeat the sign-in and registration actions.
  if (isAuthRoute) return null;

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/');
  };

  const primary = user ? dashboardLink[user.role] : null;

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link to="/" className="app-brand" onClick={() => setMenuOpen(false)}>
          <span className="app-brand-mark" aria-hidden="true">
            RE
          </span>
          <span className="app-brand-copy">
            <span className="app-brand-name">RealEstate</span>
            <span className="app-brand-tag">Property marketplace</span>
          </span>
        </Link>

        <button
          type="button"
          className="app-nav-toggle"
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? (
            icons.close
          ) : (
            <span className="app-nav-bars" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          )}
        </button>

        <nav
          id="primary-navigation"
          className={menuOpen ? 'app-nav open' : 'app-nav'}
          aria-label="Primary navigation"
        >
          <div className="app-nav-links">
            <NavLink to="/listings" className="app-nav-link" onClick={() => setMenuOpen(false)}>
              Browse homes
            </NavLink>

            {user && primary && (
              <NavLink to={primary.to} className="app-nav-link" onClick={() => setMenuOpen(false)}>
                <span className="app-nav-icon">{primary.icon}</span>
                {primary.label}
              </NavLink>
            )}

            {user && (
              <NavLink
                to="/dashboard/saved"
                className="app-nav-link"
                onClick={() => setMenuOpen(false)}
              >
                <span className="app-nav-icon">{icons.heart}</span>
                Saved items
                {savedCount > 0 && <span className="app-nav-count">{savedCount}</span>}
              </NavLink>
            )}

            {user && (
              <NavLink to="/messages" className="app-nav-link" onClick={() => setMenuOpen(false)}>
                <span className="app-nav-icon">{icons.message}</span>
                Messages
                {messagesUnread > 0 && <span className="app-nav-count">{messagesUnread}</span>}
              </NavLink>
            )}

            {user?.role === 'agent' && (
              <NavLink to="/dashboard" className="app-nav-link" onClick={() => setMenuOpen(false)}>
                Dashboard
              </NavLink>
            )}
          </div>

          <div className="app-nav-account">
            {user ? (
              <>
                <Link
                  to="/profile"
                  className="app-account-chip"
                  onClick={() => setMenuOpen(false)}
                  aria-label={`Account: ${user.name}`}
                >
                  <Avatar user={user} size={32} />
                  <span className="app-account-copy">
                    <span className="app-account-name">{user.name}</span>
                    <span className="app-account-role">{roleLabel[user.role] || 'Member'}</span>
                  </span>
                </Link>
                <button type="button" className="btn btn-ghost app-signout" onClick={handleLogout}>
                  Sign out
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className="app-nav-link app-nav-signin" onClick={() => setMenuOpen(false)}>
                  Sign in
                </NavLink>
                <Link to="/register" className="btn btn-primary app-register" onClick={() => setMenuOpen(false)}>
                  Create account
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>

      {menuOpen && (
        <button
          type="button"
          className="app-nav-scrim"
          aria-label="Close navigation menu"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </header>
  );
}
