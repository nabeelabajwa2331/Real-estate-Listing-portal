const AUTH_PATHS = /^\/(login|register|forgot-password|reset-password|verify)(\/|$|\?)/;

export const safeNextPath = (value) => {
  if (typeof value !== 'string') return null;
  const next = value.trim();
  if (!next || !next.startsWith('/')) return null;
  // `//host` and `/\host` are treated as protocol-relative URLs by browsers.
  if (next.startsWith('//') || next.includes('\\')) return null;
  // Control characters can be used to smuggle a different URL.
  if (/[\u0000-\u001f\u007f]/.test(next)) return null;
  // Never bounce back to an auth screen (avoids redirect loops).
  if (AUTH_PATHS.test(next)) return null;
  return next;
};

const withNext = (path, next) => {
  const safe = safeNextPath(next);
  return safe ? `${path}?next=${encodeURIComponent(safe)}` : path;
};

export const loginPath = (next) => withNext('/login', next);
export const registerPath = (next) => withNext('/register', next);

export const locationToPath = (location) => {
  if (!location?.pathname) return null;
  return `${location.pathname}${location.search || ''}${location.hash || ''}`;
};
