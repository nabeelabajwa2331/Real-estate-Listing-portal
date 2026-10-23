import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { errorMessage } from '../api/axios.js';
import AuthShell from '../components/AuthShell.jsx';
import { useAuth, homeForRole } from '../context/AuthContext.jsx';
import { isPakistaniPhone, normalizePakistaniPhone, PHONE_HINT, PHONE_MESSAGE } from '../utils/phone.js';

const empty = { name: '', email: '', phone: '', password: '', confirm: '', role: 'user' };

export default function Register() {
  const { user, register } = useAuth();
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  if (user) return <Navigate to={homeForRole(user.role)} replace />;

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (name === 'phone') setPhoneError('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isPakistaniPhone(form.phone)) {
      setPhoneError(PHONE_MESSAGE);
      return;
    }
    if (form.password !== form.confirm) {
      setError('The two passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      const { confirm, ...payload } = form;
      setDone(await register({ ...payload, phone: normalizePakistaniPhone(form.phone) }));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <AuthShell
        eyebrow="You're in"
        title="Account created"
        subtitle="One last step before you start browsing."
        asideTitle="Welcome to RealEstate."
        asideText="Save your favourite homes, talk to agents and keep every search in one place."
      >
        <div className="auth-success">
          <p className="alert alert-success">{done}</p>
          <Link to="/login" className="btn btn-primary btn-lg">
            Go to sign in
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Join RealEstate"
      title="Create your account"
      subtitle="Free for buyers, renters and agents."
      asideTitle="A better way to find your next place."
      asideText="Search verified homes, save the ones you love and talk directly to the agent — without the noise."
      footer={
        <>
          Already registered? <Link to="/login">Sign in</Link>
        </>
      }
    >
      <form className="form auth-form" onSubmit={onSubmit}>
        {error && <p className="alert alert-error">{error}</p>}

        <fieldset className="role-picker auth-role-picker">
          <legend>I want to</legend>
          <label className={form.role === 'user' ? 'role active' : 'role'}>
            <input type="radio" name="role" value="user" checked={form.role === 'user'} onChange={onChange} />
            <span className="role-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 10.5 12 3l9 7.5" />
                <path d="M5 9.5V21h14V9.5" />
                <path d="M9.5 21v-6h5v6" />
              </svg>
            </span>
            <span className="role-copy">
              <strong>Buy or rent</strong>
              <small>Browse, save and contact agents</small>
            </span>
          </label>
          <label className={form.role === 'agent' ? 'role active' : 'role'}>
            <input type="radio" name="role" value="agent" checked={form.role === 'agent'} onChange={onChange} />
            <span className="role-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="15" r="4" />
                <path d="m11 12 9-9" />
                <path d="m17 6 2 2" />
                <path d="m14 9 2 2" />
              </svg>
            </span>
            <span className="role-copy">
              <strong>List properties</strong>
              <small>Agent account and dashboard</small>
            </span>
          </label>
        </fieldset>

        <div className="auth-field-grid">
          <label>
            Full name
            <input
              name="name"
              value={form.name}
              onChange={onChange}
              required
              minLength={2}
              autoComplete="name"
              placeholder="Ayesha Khan"
            />
          </label>
          <label>
            Phone
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={onChange}
              required
              inputMode="tel"
              maxLength={16}
              placeholder="0300 1234567"
              autoComplete="tel"
              aria-invalid={phoneError ? 'true' : undefined}
            />
            <span className={phoneError ? 'field-hint field-hint-error' : 'field-hint'}>
              {phoneError || PHONE_HINT}
            </span>
          </label>
          <label className="span-2">
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
          </label>
          <label>
            Password
            <div className="password-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={onChange}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="At least 8 characters"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>
          <label>
            Confirm password
            <div className="password-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirm"
                value={form.confirm}
                onChange={onChange}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Repeat your password"
              />
            </div>
          </label>
        </div>

        <button className="btn btn-primary btn-lg" disabled={busy}>
          {busy ? 'Creating account...' : 'Create account'}
        </button>
        <p className="auth-terms muted small">By creating an account you agree to the fair-use rules of this demo.</p>
      </form>
    </AuthShell>
  );
}
