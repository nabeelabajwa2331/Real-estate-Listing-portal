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
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

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
          <NavLink to="/listings">Browse</NavLink>

          {user ? (
            <>
              <NavLink to={homeForRole(user.role)}>{dashboardLabel[user.role]}</NavLink>
              <NavLink to="/dashboard/favorites">Saved</NavLink>
              <NavLink to="/chat" className="nav-inbox">
                Chat
                {chatUnread > 0 && <span className="nav-badge">{chatUnread}</span>}
              </NavLink>
              <NavLink to="/inbox" className="nav-inbox">
                Inbox
                {unread > 0 && <span className="nav-badge">{unread}</span>}
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
