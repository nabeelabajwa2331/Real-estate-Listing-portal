import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import api, { errorMessage } from '../api/axios.js';
import { useAuth, homeForRole } from '../context/AuthContext.jsx';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname; // page the user was sent here from

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [notVerified, setNotVerified] = useState(false);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={from || homeForRole(user.role)} replace />;

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setNotVerified(false);
    setBusy(true);
    try {
      const signedIn = await login(form.email, form.password);
      navigate(from || homeForRole(signedIn.role), { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setNotVerified(err?.response?.data?.code === 'NOT_VERIFIED');
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setError('');
    try {
      const { data } = await api.post('/auth/resend-verification', { email: form.email });
      setNotice(data.message);
      setNotVerified(false);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <form className="card form" onSubmit={onSubmit}>
      <h1>Sign in</h1>
      {error && <p className="alert alert-error">{error}</p>}
      {notice && <p className="alert alert-success">{notice}</p>}
      {notVerified && (
        <button type="button" className="btn" onClick={resend}>
          Resend verification email
        </button>
      )}

      <label>
        Email
        <input type="email" name="email" value={form.email} onChange={onChange} required autoComplete="email" />
      </label>
      <label>
        Password
        <input type="password" name="password" value={form.password} onChange={onChange} required autoComplete="current-password" />
      </label>

      <button className="btn btn-primary" disabled={busy}>
        {busy ? 'Signing in...' : 'Sign in'}
      </button>

      <p className="small">
        <Link to="/forgot-password">Forgot your password?</Link>
      </p>
      <p className="small">
        No account yet? <Link to="/register">Register</Link>
      </p>
    </form>
  );
}
