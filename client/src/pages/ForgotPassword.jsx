import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api/axios.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setDone(data.message);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card form" onSubmit={onSubmit}>
      <h1>Forgot password</h1>
      {error && <p className="alert alert-error">{error}</p>}
      {done ? (
        <p className="alert alert-success">{done}</p>
      ) : (
        <>
          <p className="muted small">Enter your email and we will send you a link to choose a new password.</p>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </label>
          <button className="btn btn-primary" disabled={busy}>
            {busy ? 'Sending...' : 'Send reset link'}
          </button>
        </>
      )}
      <p className="small">
        <Link to="/login">Back to sign in</Link>
      </p>
    </form>
  );
}
