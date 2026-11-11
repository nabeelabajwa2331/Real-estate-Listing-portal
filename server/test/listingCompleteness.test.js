import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hasCoordinates,
  listingCompletenessError,
} from '../utils/listingCompleteness.js';

const complete = {
  address: { street: 'House 12, Street 4', city: 'Lahore' },
  location: { type: 'Point', coordinates: [74.3587, 31.5204] },
  images: [{ url: '/uploads/a.jpg' }],
};

test('a complete listing has no error', () => {
  assert.equal(listingCompletenessError(complete), '');
});

test('a street address and city are required', () => {
  assert.match(
    listingCompletenessError({ ...complete, address: { city: 'Lahore' } }),
    /street address/i
  );
  assert.match(
    listingCompletenessError({ ...complete, address: { street: 'House 12' } }),
    /city/i
  );
});

test('valid map coordinates are required', () => {
  assert.equal(hasCoordinates(complete.location), true);
  assert.equal(hasCoordinates({ coordinates: [1] }), false);
  assert.equal(hasCoordinates({ coordinates: ['x', 2] }), false);
  assert.match(listingCompletenessError({ ...complete, location: undefined }), /map location/i);
});

test('at least one photo is required', () => {
  assert.match(listingCompletenessError({ ...complete, images: [] }), /photo/i);
  assert.match(listingCompletenessError({ ...complete, images: undefined }), /photo/i);
});
