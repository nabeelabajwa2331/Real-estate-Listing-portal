export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

const PICSUM_SEED = /^https?:\/\/picsum\.photos\/seed\/([^/?#]+)/i;

export const assetUrl = (url) => {
  if (!url || typeof url !== 'string') return url;

  const seed = PICSUM_SEED.exec(url);
  if (seed) return `/img/listings/${seed[1]}.jpg`;

  if (/^(https?:|blob:|data:)/i.test(url)) return url;
  return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

export const FALLBACK_IMAGE = '/img/listings/placeholder.svg';
