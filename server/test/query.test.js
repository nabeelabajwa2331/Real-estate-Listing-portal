import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escapeRegex, cleanSearchParams, ALLOWED_SEARCH_KEYS, sameSearchParams } from '../utils/query.js';

test('escapeRegex neutralises regex metacharacters', () => {
  assert.equal(escapeRegex('a.b*c'), 'a\\.b\\*c');
  assert.equal(escapeRegex('Lahore'), 'Lahore');
  assert.equal(escapeRegex('a+b?'), 'a\\+b\\?');
});

test('cleanSearchParams keeps allowed keys and drops everything else', () => {
  const out = cleanSearchParams({ city: 'Lahore', minPrice: '5000', evil: '<script>', empty: '' });
  assert.deepEqual(out, { city: 'Lahore', minPrice: '5000' });
  assert.equal('evil' in out, false);
});

test('cleanSearchParams coerces to strings and caps length', () => {
  const out = cleanSearchParams({ q: 'a'.repeat(500), bedrooms: 3 });
  assert.equal(out.q.length, 120);
  assert.equal(out.bedrooms, '3');
});

test('ALLOWED_SEARCH_KEYS includes sort and map bounds', () => {
  for (const key of ['sort', 'north', 'south', 'east', 'west']) {
    assert.ok(ALLOWED_SEARCH_KEYS.includes(key), `missing ${key}`);
  }
});

test('sameSearchParams matches regardless of key order and value type', () => {
  assert.equal(sameSearchParams({ city: 'Lahore', bedrooms: '3' }, { bedrooms: 3, city: 'Lahore' }), true);
  assert.equal(sameSearchParams({}, {}), true);
});

test('sameSearchParams detects different criteria', () => {
  assert.equal(sameSearchParams({ city: 'Lahore' }, { city: 'Karachi' }), false);
  assert.equal(sameSearchParams({ city: 'Lahore' }, { city: 'Lahore', bedrooms: '2' }), false);
  assert.equal(sameSearchParams({ minPrice: '10' }, { minPrice: '100' }), false);
});
