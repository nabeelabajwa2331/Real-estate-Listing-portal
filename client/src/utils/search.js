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
