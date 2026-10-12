import { describe, it, expect } from 'vitest';
import { searchSummary, searchQueryString } from './search.js';

describe('searchSummary', () => {
  it('summarises the main filters', () => {
    expect(
      searchSummary({ listingType: 'rent', propertyType: 'house', city: 'Lahore', bedrooms: '3' })
    ).toBe('For rent · House · Lahore · 3+ beds');
  });

  it('includes price and area ranges', () => {
    expect(searchSummary({ minPrice: '1000000', maxPrice: '5000000' })).toBe(
      'Price 1,000,000–5,000,000'
    );
    expect(searchSummary({ minArea: '1000' })).toBe('Area 1,000–∞ sqft');
  });

  it('falls back to a generic label', () => {
    expect(searchSummary({})).toBe('All listings');
  });
});

describe('searchQueryString', () => {
  it('serialises only defined, non-empty params', () => {
    expect(searchQueryString({ city: 'Lahore', minPrice: '5000', bedrooms: '' })).toBe(
      'city=Lahore&minPrice=5000'
    );
  });

  it('drops null and undefined values', () => {
    expect(searchQueryString({ city: null, sort: undefined, listingType: 'sale' })).toBe(
      'listingType=sale'
    );
  });
});
