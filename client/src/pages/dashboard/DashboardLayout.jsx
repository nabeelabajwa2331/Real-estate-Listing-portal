import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Avatar from '../../components/Avatar.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useFavorites } from '../../context/FavoritesContext.jsx';
import { useSavedSearches } from '../../context/SavedSearchesContext.jsx';
import { useInquiries } from '../../context/InquiryContext.jsx';
import { useChat } from '../../context/ChatContext.jsx';

const roleLabel = { agent: 'Agent', user: 'Buyer / renter' };
const roleHome = { agent: '/agent' };
const roleHomeLabel = { agent: 'My listings' };

const iconProps = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

const icons = {
  overview: (
    <svg {...iconProps}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  heart: (
    <svg {...iconProps}>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  ),
  search: (
    <svg {...iconProps}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  ),
  message: (
    <svg {...iconProps}>
      <path d="M21 12a8 8 0 0 1-8 8H6l-3 2 1-5a8 8 0 1 1 17-5z" />
    </svg>
  ),
  browse: (
    <svg {...iconProps}>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10" />
      <path d="M10 20v-6h4v6" />
    </svg>
  ),
  user: (
    <svg {...iconProps}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>
  ),
  building: (
    <svg {...iconProps}>
      <path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
      <path d="M16 9h2a2 2 0 0 1 2 2v10" />
      <path d="M8 7h4M8 11h4M8 15h4M8 19h4" />
    </svg>
  ),
  menu: (
    <svg {...iconProps}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  close: (
    <svg {...iconProps}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  ),
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { count } = useFavorites();
  const { count: searchCount } = useSavedSearches();
  const { unread: inquiryUnread } = useInquiries();
  const { unread: chatUnread } = useChat();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const messagesUnread = inquiryUnread + chatUnread;

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Escape closes the drawer and the page behind it is locked while open.
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

  const onLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/');
  };

  return (
    <section className={menuOpen ? 'dash-shell dash-shell-open' : 'dash-shell'}>
      <aside id="dashboard-sidebar" className="dash-sidebar" aria-label="Dashboard sidebar">
        <div className="dash-sidebar-head">
          <Link to="/" className="dash-brand" onClick={() => setMenuOpen(false)}>
            <span className="dash-brand-mark" aria-hidden="true">
              RE
            </span>
            <span className="dash-brand-copy">
              <span className="dash-brand-name">RealEstate</span>
              <span className="dash-brand-tag">Member workspace</span>
            </span>
          </Link>
          <button
            type="button"
            className="dash-close"
            aria-label="Close dashboard menu"
            onClick={() => setMenuOpen(false)}
          >
            {icons.close}
          </button>
        </div>

        <div className="dash-profile">
          <Avatar user={user} size={42} />
          <div className="dash-profile-text">
            <p className="dash-profile-name">{user.name}</p>
            <p className="dash-profile-role">{roleLabel[user.role] || 'Member'}</p>
          </div>
        </div>

        <nav className="dash-nav-list" aria-label="Dashboard navigation">
          <p className="dash-nav-label">Workspace</p>
          <NavLink to="/dashboard" end className="dash-nav-link">
            <span className="dash-nav-icon">{icons.overview}</span>
            <span className="dash-nav-text">Dashboard</span>
          </NavLink>
          <NavLink to="/dashboard/saved" className="dash-nav-link">
            <span className="dash-nav-icon">{icons.heart}</span>
            <span className="dash-nav-text">Saved items</span>
            {count > 0 && <span className="dash-nav-count">{count}</span>}
          </NavLink>
          <NavLink to="/dashboard/searches" className="dash-nav-link">
            <span className="dash-nav-icon">{icons.search}</span>
            <span className="dash-nav-text">Saved searches</span>
            {searchCount > 0 && <span className="dash-nav-count">{searchCount}</span>}
          </NavLink>
          <NavLink to="/messages" className="dash-nav-link">
            <span className="dash-nav-icon">{icons.message}</span>
            <span className="dash-nav-text">Messages</span>
            {messagesUnread > 0 && <span className="dash-nav-count">{messagesUnread}</span>}
          </NavLink>
          <NavLink to="/listings" className="dash-nav-link">
            <span className="dash-nav-icon">{icons.browse}</span>
            <span className="dash-nav-text">Browse listings</span>
          </NavLink>

          <p className="dash-nav-label dash-nav-label-spaced">Account</p>
          <NavLink to="/profile" className="dash-nav-link">
            <span className="dash-nav-icon">{icons.user}</span>
            <span className="dash-nav-text">Profile settings</span>
          </NavLink>
          {roleHome[user.role] && (
            <NavLink to={roleHome[user.role]} className="dash-nav-link">
              <span className="dash-nav-icon">{icons.building}</span>
              <span className="dash-nav-text">{roleHomeLabel[user.role]}</span>
            </NavLink>
          )}
        </nav>

        <div className="dash-sidebar-foot">
          <p className="dash-sidebar-note">
            Signed in as <strong>{user.name}</strong>
          </p>
          <button type="button" className="dash-signout" onClick={onLogout}>
            Sign out
          </button>
        </div>
      </aside>

      {menuOpen && (
        <button
          type="button"
          className="dash-scrim"
          aria-label="Close dashboard menu"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div className="dash-main">
        <div className="dash-mobile-bar">
          <button
            type="button"
            className="dash-menu-btn"
            aria-expanded={menuOpen}
            aria-controls="dashboard-sidebar"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {icons.menu}
            <span>Menu</span>
          </button>
          <Link to="/" className="dash-mobile-brand">
            RealEstate
          </Link>
          <Link to="/profile" className="dash-mobile-avatar" aria-label="Profile settings">
            <Avatar user={user} size={30} />
          </Link>
        </div>

        <div className="dash-content">
          <Outlet />
        </div>
      </div>
    </section>
  );
}
