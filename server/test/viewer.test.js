import test from 'node:test';
import assert from 'node:assert/strict';
import { viewerKey } from '../utils/viewer.js';

test('viewer keys are stable for the same viewer and listing-independent', () => {
  assert.equal(viewerKey({ userId: 'abc', salt: 'salt' }), viewerKey({ userId: 'abc', salt: 'salt' }));
});

test('viewer keys differ between users and guests', () => {
  const user = viewerKey({ userId: 'abc', salt: 'salt' });
  const guestA = viewerKey({ ip: '203.0.113.4', salt: 'salt' });
  const guestB = viewerKey({ ip: '203.0.113.5', salt: 'salt' });
  assert.notEqual(user, guestA);
  assert.notEqual(guestA, guestB);
});

test('the key never contains the raw IP address or user id', () => {
  const key = viewerKey({ ip: '203.0.113.4', salt: 'salt' });
  assert.equal(key.includes('203.0.113.4'), false);
  assert.match(key, /^[a-f0-9]{64}$/);
});
