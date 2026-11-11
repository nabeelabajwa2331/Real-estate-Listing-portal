// Post-login redirects are carried in a `?next=` query parameter so they survive
// a full page reload and can be shared between the login and registration
// screens. Only same-origin absolute paths are accepted: an open redirect such
// as `//evil.example` or `https://evil.example` is rejected.

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

// Reconstructs the full destination from a react-router location object, used
// by the legacy `state.from` flow as well as the query-parameter flow.
export const locationToPath = (location) => {
  if (!location?.pathname) return null;
  return `${location.pathname}${location.search || ''}${location.hash || ''}`;
};
