import test from 'node:test';
import assert from 'node:assert/strict';
import { isPakistaniPhone, normalizePakistaniPhone } from '../utils/phone.js';

test('normalizes Pakistani numbers to 03XXXXXXXXX', () => {
  assert.equal(normalizePakistaniPhone('0300 1234567'), '03001234567');
  assert.equal(normalizePakistaniPhone('0300-1234567'), '03001234567');
  assert.equal(normalizePakistaniPhone('+92 300 1234567'), '03001234567');
  assert.equal(normalizePakistaniPhone('923001234567'), '03001234567');
  assert.equal(normalizePakistaniPhone('0092 300 1234567'), '03001234567');
  assert.equal(normalizePakistaniPhone('3001234567'), '03001234567');
});

test('accepts Pakistani mobile numbers only', () => {
  assert.equal(isPakistaniPhone('03001234567'), true);
  assert.equal(isPakistaniPhone('+923001234567'), true);
  assert.equal(isPakistaniPhone('0211234567'), false); // landline
  assert.equal(isPakistaniPhone('0300123456'), false); // too short
  assert.equal(isPakistaniPhone('04001234567'), false); // not a mobile prefix
  assert.equal(isPakistaniPhone(''), false);
});
