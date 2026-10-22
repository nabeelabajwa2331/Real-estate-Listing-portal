import { useState } from 'react';
import { Link } from 'react-router-dom';
import { errorMessage } from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from '../components/Avatar.jsx';
import { isPakistaniPhone, normalizePakistaniPhone, PHONE_HINT, PHONE_MESSAGE } from '../utils/phone.js';

const roleLabel = { admin: 'Administrator', agent: 'Agent', user: 'Buyer / renter' };

const iconProps = {
  width: 15,
  height: 15,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

const icons = {
  mail: (
    <svg {...iconProps}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  ),
  lock: (
    <svg {...iconProps} width={12} height={12}>
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  ),
  shield: (
    <svg {...iconProps}>
      <path d="M12 2l7 4v6c0 5-3 8-7 10-4-2-7-5-7-10V6z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  calendar: (
    <svg {...iconProps}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 11h18" />
    </svg>
  ),
  camera: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 7h3l2-2h6l2 2h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  ),
};

export default function Profile() {
  const { user, updateProfile, updateAvatar, removeAvatar } = useAuth();
  const [form, setForm] = useState({
    name: user.name || '',
    phone: user.phone || '',
    currentPassword: '',
    newPassword: '',
  });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState({ type: '', text: '' });

  const joined = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : '—';

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarBusy(true);
    setAvatarMsg({ type: '', text: '' });
    try {
      setAvatarMsg({ type: 'success', text: await updateAvatar(file) });
    } catch (err) {
      setAvatarMsg({ type: 'error', text: errorMessage(err) });
    } finally {
      setAvatarBusy(false);
      e.target.value = '';
    }
  };

  const onAvatarRemove = async () => {
    setAvatarBusy(true);
    setAvatarMsg({ type: '', text: '' });
    try {
      setAvatarMsg({ type: 'success', text: await removeAvatar() });
    } catch (err) {
      setAvatarMsg({ type: 'error', text: errorMessage(err) });
    } finally {
      setAvatarBusy(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    if (!isPakistaniPhone(form.phone)) {
      setError(PHONE_MESSAGE);
      return;
    }
    setBusy(true);
    try {
      setNotice(await updateProfile({ ...form, phone: normalizePakistaniPhone(form.phone) }));
      setForm((f) => ({ ...f, currentPassword: '', newPassword: '' }));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="profile-page">
      <header className="page-head profile-head">
        <div>
          <span className="eyebrow">Account</span>
          <h1>My profile</h1>
          <p className="muted">Manage your photo, contact details and password.</p>
        </div>
        <Link to="/dashboard" className="btn">
          Back to dashboard
        </Link>
      </header>

      <form className="profile-shell" onSubmit={onSubmit}>
        <aside className="profile-identity card">
          <label className="profile-name">
            <span className="profile-label">Name</span>
            <input
              className="profile-name-input"
              name="name"
              value={form.name}
              onChange={onChange}
              required
              minLength={2}
              maxLength={80}
              aria-label="Your name"
            />
          </label>

          <div className="profile-avatar">
            <label
              className={avatarBusy ? 'profile-avatar-button busy' : 'profile-avatar-button'}
              title="Change profile photo"
            >
              <Avatar user={user} size={148} />
              <span className="profile-camera">{icons.camera}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={onAvatarChange}
                disabled={avatarBusy}
                aria-label="Upload a profile photo"
              />
            </label>
            <p className="muted small">
              {avatarBusy ? 'Uploading photo…' : 'Tap the camera to choose a profile photo'}
            </p>
            {user.avatar && (
              <button type="button" className="link-btn" onClick={onAvatarRemove} disabled={avatarBusy}>
                Remove photo
              </button>
            )}
          </div>

          <div className="profile-info">
            <div className="profile-info-row">
              <span className="profile-info-label">
                {icons.mail} Email
              </span>
              <span className="profile-info-value">{user.email}</span>
              <span className="profile-lock" title="Email cannot be changed">
                {icons.lock} Locked
              </span>
            </div>
            <div className="profile-info-row">
              <span className="profile-info-label">
                {icons.shield} Account
              </span>
              <span className="profile-info-value">{roleLabel[user.role] || 'Member'}</span>
            </div>
            <div className="profile-info-row">
              <span className="profile-info-label">
                {icons.calendar} Joined
              </span>
              <span className="profile-info-value">{joined}</span>
            </div>
          </div>

          {avatarMsg.text && (
            <p className={avatarMsg.type === 'error' ? 'alert alert-error' : 'alert alert-success'}>
              {avatarMsg.text}
            </p>
          )}
        </aside>

        <div className="profile-settings">
          <section className="card profile-card">
            <div className="profile-card-head">
              <h2>Contact details</h2>
              <p className="muted small">Your phone number is shared only with agents you contact.</p>
            </div>
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
              />
              <span className="field-hint">{PHONE_HINT}</span>
            </label>
          </section>

          <section className="card profile-card">
            <div className="profile-card-head">
              <h2>Password</h2>
              <p className="muted small">Leave both fields empty to keep your current password.</p>
            </div>
            <div className="profile-field-grid">
              <label>
                Current password
                <input
                  type="password"
                  name="currentPassword"
                  value={form.currentPassword}
                  onChange={onChange}
                  autoComplete="current-password"
                />
              </label>
              <label>
                New password
                <input
                  type="password"
                  name="newPassword"
                  value={form.newPassword}
                  onChange={onChange}
                  minLength={8}
                  autoComplete="new-password"
                />
              </label>
            </div>
          </section>

          {error && <p className="alert alert-error">{error}</p>}
          {notice && <p className="alert alert-success">{notice}</p>}

          <div className="profile-actions">
            <button className="btn btn-primary btn-lg" disabled={busy}>
              {busy ? 'Saving...' : 'Save changes'}
            </button>
            <span className="muted small">Your email address is permanent and cannot be changed.</span>
          </div>
        </div>
      </form>
    </section>
  );
}
