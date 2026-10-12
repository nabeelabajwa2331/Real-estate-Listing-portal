// Small pure helpers shared by controllers, kept here so they are easy to test.

export const escapeRegex = (value = '') =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// The only browse query keys a saved search may store.
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

// Whitelists and trims saved-search params so replaying them is always safe.
export const cleanSearchParams = (input = {}) => {
  const out = {};
  for (const key of ALLOWED_SEARCH_KEYS) {
    const value = input[key];
    if (value === undefined || value === null || value === '') continue;
    out[key] = String(value).slice(0, 120);
  }
  return out;
};
