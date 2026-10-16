import { Link, NavLink, useNavigate } from 'react-router-dom';
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

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden="true">
            RE
          </span>
          RealEstate
        </Link>

        <nav className="nav-links">
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
