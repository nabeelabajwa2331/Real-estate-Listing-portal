// Pure helpers for avatars (kept separate so they are easy to unit test).

export const AVATAR_PALETTE = [
  '#0f6b4f',
  '#0a4b37',
  '#14805f',
  '#2f5d4a',
  '#5f7f6b',
  '#7e9e8a',
  '#4e6b5a',
  '#8a6d4a',
];

export const initialsOf = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() || '')
    .join('') || '?';

export const colorFor = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) % 997;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
};

// Accepts either a user whose `avatar` is a URL string (publicUser) or a nested
// { url } object (populated).
export const avatarUrl = (user) =>
  (typeof user?.avatar === 'string' ? user.avatar : user?.avatar?.url) || null;
