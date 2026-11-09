import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errorMessage } from '../api/axios.js';
import AuthShell from '../components/AuthShell.jsx';

export default function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) return setError('Passwords do not match');

    setBusy(true);
    try {
      const { data } = await api.post(`/auth/reset-password/${token}`, { password });
      setDone(data.message);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Account recovery"
      title={done ? 'Password changed' : 'Choose a new password'}
      subtitle={done ? 'You can sign in with your new password now.' : 'Choose a strong password you have not used before.'}
      asideTitle="Secure your account."
      asideText="A short, unique password keeps your saved homes and conversations protected."
      footer={
        <>
          Need a new link? <Link to="/forgot-password">Request another</Link>
        </>
      }
    >
      {done ? (
        <div className="auth-success">
          <p className="alert alert-success">{done}</p>
          <Link to="/login" className="btn btn-primary btn-lg">
            Go to sign in
          </Link>
        </div>
      ) : (
        <form className="form auth-form" onSubmit={onSubmit}>
          {error && <p className="alert alert-error">{error}</p>}
          <label>
            New password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="At least 8 characters"
            />
          </label>
          <label>
            Confirm new password
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Repeat your password"
            />
          </label>
          <button className="btn btn-primary btn-lg" disabled={busy}>
            {busy ? 'Saving...' : 'Change password'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
