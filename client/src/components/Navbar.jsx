import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import Avatar from './Avatar.jsx';
import { useAuth, homeForRole } from '../context/AuthContext.jsx';
import { useInquiries } from '../context/InquiryContext.jsx';
import { useChat } from '../context/ChatContext.jsx';

const dashboardLabel = { admin: 'Admin panel', agent: 'My listings', user: 'Dashboard' };

export default function Navbar() {
  const { user, logout } = useAuth();
  const { unread } = useInquiries();
  const { unread: chatUnread } = useChat();
  const messagesUnread = unread + chatUnread;
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  // The dashboard sidebar already owns account navigation and sign out, so the
  // header keeps only the brand and the primary browse link on those screens.
  const onDashboard = location.pathname.startsWith('/dashboard');
  const isAuthRoute =
    ['/login', '/register', '/forgot-password'].includes(location.pathname) ||
    location.pathname.startsWith('/reset-password');

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Allow keyboard users to dismiss with Escape.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  // Auth screens carry their own brand header, so the global navigation would
  // only repeat the sign-in and registration actions.
  if (isAuthRoute) return null;

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand" onClick={() => setMenuOpen(false)}>
          <span className="brand-mark" aria-hidden="true">
            RE
          </span>
          RealEstate
        </Link>

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="nav-toggle-box" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>

        <nav id="primary-navigation" className={menuOpen ? 'nav-links open' : 'nav-links'}>
          {user ? (
            <>
              <NavLink to="/listings">Browse</NavLink>
              {!onDashboard && (
                <>
                  <NavLink to={homeForRole(user.role)}>{dashboardLabel[user.role]}</NavLink>
                  <NavLink to="/dashboard/favorites">Saved</NavLink>
                  <NavLink to="/messages" className="nav-inbox">
                    Messages
                    {messagesUnread > 0 && <span className="nav-badge">{messagesUnread}</span>}
                  </NavLink>
                  <NavLink to="/profile" className="nav-user">
                    <Avatar user={user} size={24} />
                    {user.name}
                  </NavLink>
                  <div className="nav-actions">
                    <button type="button" className="btn btn-ghost" onClick={handleLogout}>
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <NavLink to="/login">Sign in</NavLink>
              <div className="nav-actions">
                <Link to="/register" className="btn btn-primary">
                  Register
                </Link>
              </div>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
