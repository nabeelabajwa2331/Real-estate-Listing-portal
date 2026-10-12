import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errorMessage } from '../api/axios.js';

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

  if (done) {
    return (
      <div className="card form">
        <h1>Password changed</h1>
        <p className="alert alert-success">{done}</p>
        <Link to="/login" className="btn btn-primary">
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <form className="card form" onSubmit={onSubmit}>
      <h1>Choose a new password</h1>
      {error && <p className="alert alert-error">{error}</p>}
      <label>
        New password
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
      </label>
      <label>
        Confirm new password
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} autoComplete="new-password" />
      </label>
      <button className="btn btn-primary" disabled={busy}>
        {busy ? 'Saving...' : 'Change password'}
      </button>
    </form>
  );
}
