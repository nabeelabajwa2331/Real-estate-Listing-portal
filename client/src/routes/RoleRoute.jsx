import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, homeForRole } from '../context/AuthContext.jsx';
import { locationToPath, loginPath } from '../utils/redirect.js';

// Like ProtectedRoute, but also requires one of the given roles.
// Usage: <Route element={<RoleRoute roles={['agent']} />}> ... </Route>
export default function RoleRoute({ roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="page-loading" role="status" aria-live="polite">
        <span className="spinner" aria-hidden="true" />
        <span className="muted">Checking your session…</span>
      </div>
    );
  }
  if (!user) return <Navigate to={loginPath(locationToPath(location))} replace />;
  // Send signed-in users to the workspace that belongs to their real role
  // instead of exposing an admin screen to a member.
  if (!roles.includes(user.role)) return <Navigate to={homeForRole(user.role)} replace />;
  return <Outlet />;
}
