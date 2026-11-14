export const escapeRegex = (value = '') =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const ALLOWED_SEARCH_KEYS = [
  'city',
  'listingType',
  'propertyType',
  'minPrice',
  'maxPrice',
  'minArea',
  'maxArea',
  'bedrooms',
  'q',
  'sort',
  'north',
  'south',
  'east',
  'west',
];

export const cleanSearchParams = (input = {}) => {
  const out = {};
  for (const key of ALLOWED_SEARCH_KEYS) {
    const value = input[key];
    if (value === undefined || value === null || value === '') continue;
    out[key] = String(value).slice(0, 120);
  }
  return out;
};

export const sameSearchParams = (a = {}, b = {}) => {
  const keysA = Object.keys(a).sort();
  const keysB = Object.keys(b).sort();
  if (keysA.length !== keysB.length) return false;
  return keysA.every((key, index) => key === keysB[index] && String(a[key]) === String(b[key]));
};
