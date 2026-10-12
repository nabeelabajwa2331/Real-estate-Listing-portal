import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isDisallowedEmail, emailDomain, domainCanReceiveMail } from '../utils/email.js';

test('rejects placeholder domains', () => {
  assert.equal(isDisallowedEmail('a@example.com'), true);
  assert.equal(isDisallowedEmail('a@test.com'), true);
  assert.equal(isDisallowedEmail('a@foo.invalid'), true);
  assert.equal(isDisallowedEmail('a@localhost'), true);
});

test('rejects disposable domains', () => {
  assert.equal(isDisallowedEmail('a@mailinator.com'), true);
  assert.equal(isDisallowedEmail('a@yopmail.com'), true);
});

test('allows normal addresses', () => {
  assert.equal(isDisallowedEmail('nabeela@gmail.com'), false);
  assert.equal(isDisallowedEmail('a@company.com.pk'), false);
});

test('emailDomain extracts the lowercased domain', () => {
  assert.equal(emailDomain('A@Gmail.com'), 'gmail.com');
  assert.equal(emailDomain('bad'), '');
});

test('domainCanReceiveMail rejects an empty domain without a lookup', async () => {
  assert.equal(await domainCanReceiveMail(''), false);
});
