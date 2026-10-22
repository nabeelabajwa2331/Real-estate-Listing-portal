// Where the API lives.
//
// - When the server serves the built client (single-service deployment), this
//   stays empty and every request goes to the same origin ("/api").
// - When the client is hosted separately, set VITE_API_URL to the API host
//   (e.g. https://your-api.example.com) at build time.
export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

// Seeded demo listings originally pointed at picsum.photos. Those remote
// images are slow (and blocked on some mobile networks), so the exact same
// photos now ship with the client. Map the old URLs to the bundled copies.
const PICSUM_SEED = /^https?:\/\/picsum\.photos\/seed\/([^/?#]+)/i;

// Stored images may be relative ("/uploads/x.jpg" when Cloudinary is not
// configured). Prefix them with the API host so they load when the client and
// API are on different origins. Absolute/blob/data URLs are returned unchanged.
export const assetUrl = (url) => {
  if (!url || typeof url !== 'string') return url;

  const seed = PICSUM_SEED.exec(url);
  if (seed) return `/img/listings/${seed[1]}.jpg`;

  if (/^(https?:|blob:|data:)/i.test(url)) return url;
  return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

// Local photo shown whenever a listing image is missing or fails to load.
export const FALLBACK_IMAGE = '/img/listings/placeholder.svg';
