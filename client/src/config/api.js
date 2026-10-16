// Where the API lives.
//
// - When the server serves the built client (Docker / Render single service),
//   this stays empty and every request goes to the same origin ("/api").
// - When the client is hosted separately (e.g. on Vercel), set VITE_API_URL to
//   the API host (e.g. https://your-app.onrender.com) at build time.
export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

// Stored images may be relative ("/uploads/x.jpg" when Cloudinary is not
// configured). Prefix them with the API host so they load when the client and
// API are on different origins. Absolute/blob/data URLs are returned unchanged.
export const assetUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  if (/^(https?:|blob:|data:)/i.test(url)) return url;
  return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};
