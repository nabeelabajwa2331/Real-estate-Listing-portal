import { test } from 'node:test';
import assert from 'node:assert/strict';
import User from '../models/User.js';

// Sessions issued before a password change must stop working.

test('a token is accepted when the password never changed', () => {
  const user = new User({ name: 'A', email: 'a@example.com', password: 'x'.repeat(8) });
  assert.equal(user.tokenPredatesPassword(Math.floor(Date.now() / 1000)), false);
});

test('a token issued before the password changed is rejected', () => {
  const changedAt = new Date('2026-01-01T12:00:00Z');
  const user = new User({ name: 'A', email: 'a@example.com', password: 'x'.repeat(8), passwordChangedAt: changedAt });
  const issuedBefore = Math.floor(changedAt.getTime() / 1000) - 60;
  assert.equal(user.tokenPredatesPassword(issuedBefore), true);
});

test('a token issued after the password changed is accepted', () => {
  const changedAt = new Date('2026-01-01T12:00:00Z');
  const user = new User({ name: 'A', email: 'a@example.com', password: 'x'.repeat(8), passwordChangedAt: changedAt });
  const issuedAfter = Math.floor(changedAt.getTime() / 1000) + 1;
  assert.equal(user.tokenPredatesPassword(issuedAfter), false);
});

test('the session re-issued right after a change stays valid', () => {
  // Mirrors the pre-save hook, which back-dates the change by one second.
  const now = Date.now();
  const user = new User({
    name: 'A',
    email: 'a@example.com',
    password: 'x'.repeat(8),
    passwordChangedAt: new Date(now - 1000),
  });
  assert.equal(user.tokenPredatesPassword(Math.floor(now / 1000)), false);
});
