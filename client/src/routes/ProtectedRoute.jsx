import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { locationToPath, loginPath } from '../utils/redirect.js';

export default function ProtectedRoute() {
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
  return <Outlet />;
}
