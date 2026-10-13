import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { errorMessage } from '../api/axios.js';
import { useAuth, homeForRole } from '../context/AuthContext.jsx';

const empty = { name: '', email: '', phone: '', password: '', confirm: '', role: 'user' };

export default function Register() {
  const { user, register } = useAuth();
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={homeForRole(user.role)} replace />;

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match');

    setBusy(true);
    try {
      const { confirm, ...payload } = form;
      setDone(await register(payload));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="card form">
        <h1>Account created</h1>
        <p className="alert alert-success">{done}</p>
        <Link to="/login" className="btn btn-primary">
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <form className="card form" onSubmit={onSubmit}>
      <h1>Create an account</h1>
      <p className="muted small">Use a real email you can access — we'll send a verification link.</p>
      {error && <p className="alert alert-error">{error}</p>}

      <fieldset className="role-picker">
        <legend>I want to</legend>
        <label className={form.role === 'user' ? 'role active' : 'role'}>
          <input type="radio" name="role" value="user" checked={form.role === 'user'} onChange={onChange} />
          Buy or rent
        </label>
        <label className={form.role === 'agent' ? 'role active' : 'role'}>
          <input type="radio" name="role" value="agent" checked={form.role === 'agent'} onChange={onChange} />
          List properties (agent)
        </label>
      </fieldset>

      <label>
        Full name
        <input name="name" value={form.name} onChange={onChange} required minLength={2} autoComplete="name" />
      </label>
      <label>
        Email
        <input type="email" name="email" value={form.email} onChange={onChange} required autoComplete="email" />
      </label>
      <label>
        Phone
        <input type="tel" name="phone" value={form.phone} onChange={onChange} required placeholder="03001234567" autoComplete="tel" />
      </label>
      <label>
        Password
        <input type="password" name="password" value={form.password} onChange={onChange} required minLength={8} autoComplete="new-password" />
      </label>
      <label>
        Confirm password
        <input type="password" name="confirm" value={form.confirm} onChange={onChange} required minLength={8} autoComplete="new-password" />
      </label>

      <button className="btn btn-primary" disabled={busy}>
        {busy ? 'Creating account...' : 'Register'}
      </button>
      <p className="small">
        Already registered? <Link to="/login">Sign in</Link>
      </p>
    </form>
  );
}
