import { NavLink, Outlet } from 'react-router-dom';
import Avatar from '../../components/Avatar.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useFavorites } from '../../context/FavoritesContext.jsx';

// The dashboard (favorites + saved searches) is open to every signed-in
// account, so label the account by its real role rather than assuming buyer.
const roleLabel = { admin: 'Administrator', agent: 'Agent', user: 'Buyer / renter' };

export default function DashboardLayout() {
  const { user } = useAuth();
  const { count } = useFavorites();

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
          <NavLink to="/profile">Profile settings</NavLink>
        </nav>
      </aside>

      <div className="dashboard-main">
        <Outlet />
      </div>
    </section>
  );
}
