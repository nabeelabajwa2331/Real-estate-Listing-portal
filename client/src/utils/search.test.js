import { describe, it, expect } from 'vitest';
import { searchSummary, searchQueryString, validateSearchFilters } from './search.js';

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

describe('validateSearchFilters', () => {
  it('accepts empty and valid numeric filters', () => {
    expect(validateSearchFilters({})).toBe('');
    expect(validateSearchFilters({ minPrice: '100', maxPrice: '500', bedrooms: '2' })).toBe('');
  });

  it('rejects negative or non-numeric values', () => {
    expect(validateSearchFilters({ minPrice: '-1' })).toMatch(/Minimum price/);
    expect(validateSearchFilters({ bedrooms: 'abc' })).toMatch(/Bedrooms/);
  });

  it('rejects inverted ranges', () => {
    expect(validateSearchFilters({ minPrice: '500', maxPrice: '100' })).toMatch(/price/);
    expect(validateSearchFilters({ minArea: '2000', maxArea: '1000' })).toMatch(/area/);
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
