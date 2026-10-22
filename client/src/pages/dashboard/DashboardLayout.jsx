import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import Avatar from '../../components/Avatar.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useFavorites } from '../../context/FavoritesContext.jsx';
import { useInquiries } from '../../context/InquiryContext.jsx';
import { useChat } from '../../context/ChatContext.jsx';

// The dashboard (favorites + saved searches) is open to every signed-in
// account, so label the account by its real role rather than assuming buyer.
const roleLabel = { admin: 'Administrator', agent: 'Agent', user: 'Buyer / renter' };
const roleHome = { admin: '/admin', agent: '/agent' };
const roleHomeLabel = { admin: 'Admin panel', agent: 'My listings' };

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { count } = useFavorites();
  const { unread: inquiryUnread } = useInquiries();
  const { unread: chatUnread } = useChat();
  const navigate = useNavigate();

  const messagesUnread = inquiryUnread + chatUnread;
  const onLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <section className="dashboard-layout">
      <aside className="dashboard-side card">
        <div className="dash-user">
          <Avatar user={user} size={42} />
          <div>
            <p className="dash-user-name">{user.name}</p>
            <p className="muted small">{roleLabel[user.role] || 'Member'}</p>
          </div>
        </div>

        <nav className="dash-nav">
          <NavLink to="/dashboard" end>
            Overview
          </NavLink>
          <NavLink to="/dashboard/favorites">
            Favorites {count > 0 && <span className="count">{count}</span>}
          </NavLink>
          <NavLink to="/dashboard/searches">Saved searches</NavLink>
          <NavLink to="/messages">
            Messages {messagesUnread > 0 && <span className="count">{messagesUnread}</span>}
          </NavLink>
          <NavLink to="/profile">Profile settings</NavLink>
          {roleHome[user.role] && (
            <NavLink to={roleHome[user.role]}>{roleHomeLabel[user.role]}</NavLink>
          )}
        </nav>

        <div className="dash-foot">
          <button type="button" className="dash-signout" onClick={onLogout}>
            Sign out
          </button>
        </div>
      </aside>

      <div className="dashboard-main">
        <Outlet />
      </div>
    </section>
  );
}
