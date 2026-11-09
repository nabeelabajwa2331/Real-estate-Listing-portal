import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api/axios.js';
import AuthShell from '../components/AuthShell.jsx';

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
    <AuthShell
      eyebrow="Account recovery"
      title="Forgot password"
      subtitle="We’ll email you a secure link to choose a new password."
      asideTitle="Get back to your property search."
      asideText="Your saved homes, searches and conversations will be waiting when you return."
      footer={
        <>
          Remembered it? <Link to="/login">Sign in</Link>
        </>
      }
    >
      {done ? (
        <div className="auth-success">
          <p className="alert alert-success">{done}</p>
          <Link to="/login" className="btn btn-primary btn-lg">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form className="form auth-form" onSubmit={onSubmit}>
          {error && <p className="alert alert-error">{error}</p>}
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
          </label>
          <button className="btn btn-primary btn-lg" disabled={busy}>
            {busy ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
