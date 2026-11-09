import { initialsOf, colorFor, avatarUrl } from '../utils/avatar.js';
import { assetUrl } from '../config/api.js';

// Shows the profile photo when the user has one, otherwise coloured initials.
export default function Avatar({ user, size = 40, className = '' }) {
  const name = user?.name || '';
  const photo = assetUrl(avatarUrl(user));
  const style = { width: size, height: size, fontSize: Math.round(size * 0.42) };

  if (photo) {
    return <img className={`avatar ${className}`} src={photo} alt={name || 'User'} style={style} />;
  }

  return (
    <span
      className={`avatar avatar-initials ${className}`}
      style={{ ...style, background: colorFor(name) }}
      aria-hidden="true"
    >
      {initialsOf(name)}
    </span>
  );
}
