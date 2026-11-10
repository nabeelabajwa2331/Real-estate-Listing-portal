import { describe, it, expect } from 'vitest';
import { applyFavorite, favoriteIdSet } from './favorites.js';

const home = { _id: 'a', title: 'Home' };
const flat = { _id: 'b', title: 'Flat' };

describe('applyFavorite', () => {
  it('adds a new listing to the front without duplicates', () => {
    const once = applyFavorite([flat], home, true);
    expect(once.map((item) => item._id)).toEqual(['a', 'b']);

    const twice = applyFavorite(once, home, true);
    expect(twice).toBe(once);
    expect(twice).toHaveLength(2);
  });

  it('removes a listing and is a no-op when it is not present', () => {
    expect(applyFavorite([home, flat], home, false).map((item) => item._id)).toEqual(['b']);
    const list = [flat];
    expect(applyFavorite(list, home, false)).toBe(list);
  });

  it('ignores an unknown listing', () => {
    const list = [home];
    expect(applyFavorite(list, null, true)).toBe(list);
    expect(applyFavorite(list, {}, true)).toBe(list);
  });
});

describe('favoriteIdSet', () => {
  it('builds a set of saved ids', () => {
    expect([...favoriteIdSet([home, flat])]).toEqual(['a', 'b']);
  });
});
