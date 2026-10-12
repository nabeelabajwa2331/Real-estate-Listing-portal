import { useState } from 'react';
import { errorMessage } from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from '../components/Avatar.jsx';

export default function Profile() {
  const { user, updateProfile, updateAvatar, removeAvatar } = useAuth();
  const [form, setForm] = useState({
    name: user.name,
    phone: user.phone,
    currentPassword: '',
    newPassword: '',
  });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState({ type: '', text: '' });

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
    setBusy(true);
    try {
      setNotice(await updateProfile(form));
      setForm((f) => ({ ...f, currentPassword: '', newPassword: '' }));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card form" onSubmit={onSubmit}>
      <h1>My profile</h1>
      <p className="muted small">
        {user.email} · {user.role}
      </p>

      <div className="avatar-editor">
        <Avatar user={user} size={64} />
        <div className="avatar-editor-actions">
          <label className="btn btn-sm file-btn">
            {avatarBusy ? 'Uploading...' : 'Change photo'}
            <input type="file" accept="image/*" onChange={onAvatarChange} disabled={avatarBusy} />
          </label>
          {user.avatar && (
            <button type="button" className="btn btn-sm btn-danger" onClick={onAvatarRemove} disabled={avatarBusy}>
              Remove
            </button>
          )}
        </div>
      </div>
      {avatarMsg.text && (
        <p className={avatarMsg.type === 'error' ? 'alert alert-error' : 'alert alert-success'}>{avatarMsg.text}</p>
      )}

      {error && <p className="alert alert-error">{error}</p>}
      {notice && <p className="alert alert-success">{notice}</p>}

      <label>
        Full name
        <input name="name" value={form.name} onChange={onChange} required minLength={2} />
      </label>
      <label>
        Phone
        <input type="tel" name="phone" value={form.phone} onChange={onChange} required />
      </label>

      <h2>Change password</h2>
      <p className="muted small">Leave both fields empty to keep your current password.</p>
      <label>
        Current password
        <input type="password" name="currentPassword" value={form.currentPassword} onChange={onChange} autoComplete="current-password" />
      </label>
      <label>
        New password
        <input type="password" name="newPassword" value={form.newPassword} onChange={onChange} minLength={8} autoComplete="new-password" />
      </label>

      <button className="btn btn-primary" disabled={busy}>
        {busy ? 'Saving...' : 'Save changes'}
      </button>
    </form>
  );
}
