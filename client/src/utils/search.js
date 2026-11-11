export const propertyLabels = {
  house: 'House',
  apartment: 'Apartment',
  plot: 'Plot',
  commercial: 'Commercial',
  room: 'Room',
};

const num = (value) => Number(value).toLocaleString('en-US');

// Human-readable one-liner for a saved search.
export function searchSummary(params = {}) {
  const parts = [];
  if (params.listingType) parts.push(params.listingType === 'rent' ? 'For rent' : 'For sale');
  if (params.propertyType) parts.push(propertyLabels[params.propertyType] || params.propertyType);
  if (params.city) parts.push(params.city);
  if (params.bedrooms) parts.push(`${params.bedrooms}+ beds`);
  if (params.minPrice || params.maxPrice) {
    parts.push(`Price ${params.minPrice ? num(params.minPrice) : '0'}–${params.maxPrice ? num(params.maxPrice) : '∞'}`);
  }
  if (params.minArea || params.maxArea) {
    parts.push(`Area ${params.minArea ? num(params.minArea) : '0'}–${params.maxArea ? num(params.maxArea) : '∞'} sqft`);
  }
  return parts.length ? parts.join(' · ') : 'All listings';
}

// Turns stored params back into a query string for /listings.
export function searchQueryString(params = {}) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== '' && value !== undefined && value !== null) qs.set(key, value);
  }
  return qs.toString();
}

const RANGES = [
  ['minPrice', 'maxPrice', 'price'],
  ['minArea', 'maxArea', 'area'],
];

// Validates the numeric filter fields before a request is sent. Returns an
// error message, or an empty string when the filters are usable.
export function validateSearchFilters(filters = {}) {
  for (const [key, label] of [
    ['minPrice', 'Minimum price'],
    ['maxPrice', 'Maximum price'],
    ['minArea', 'Minimum area'],
    ['maxArea', 'Maximum area'],
    ['bedrooms', 'Bedrooms'],
  ]) {
    const raw = filters[key];
    if (raw === '' || raw === undefined || raw === null) continue;
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0) {
      return `${label} must be a number of 0 or more.`;
    }
  }

  for (const [minKey, maxKey, label] of RANGES) {
    if (filters[minKey] === '' || filters[maxKey] === '') continue;
    if (Number(filters[minKey]) > Number(filters[maxKey])) {
      return `The minimum ${label} cannot be greater than the maximum ${label}.`;
    }
  }

  return '';
}
