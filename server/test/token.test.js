import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashToken, createRandomToken } from '../utils/token.js';

test('hashToken is a deterministic sha-256 hex string', () => {
  const hashed = hashToken('abc');
  assert.match(hashed, /^[a-f0-9]{64}$/);
  assert.equal(hashed, hashToken('abc'));
  assert.notEqual(hashed, hashToken('abd'));
});

test('createRandomToken returns a raw token and its matching hash', () => {
  const { raw, hashed } = createRandomToken();
  assert.equal(raw.length, 64);
  assert.equal(hashed, hashToken(raw));
  assert.notEqual(createRandomToken().raw, raw);
});
