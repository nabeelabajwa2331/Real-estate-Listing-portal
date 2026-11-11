import test from 'node:test';
import assert from 'node:assert/strict';
import { detectImageType, isAllowedImage, looksLikeSvg } from '../utils/imageType.js';

const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
const webp = Buffer.concat([
  Buffer.from('RIFF', 'ascii'),
  Buffer.from([0, 0, 0, 0]),
  Buffer.from('WEBP', 'ascii'),
  Buffer.from([0, 0, 0, 0]),
]);

test('detects real image signatures', () => {
  assert.equal(detectImageType(png), 'png');
  assert.equal(detectImageType(jpeg), 'jpeg');
  assert.equal(detectImageType(webp), 'webp');
});

test('rejects unknown, empty and spoofed content', () => {
  assert.equal(detectImageType(Buffer.from('not an image at all')), null);
  assert.equal(detectImageType(Buffer.alloc(0)), null);
  assert.equal(isAllowedImage(Buffer.from('GIF89a........')), false);
});

test('rejects SVG documents even when named as an image', () => {
  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
  assert.equal(looksLikeSvg(svg), true);
  assert.equal(isAllowedImage(svg), false);
});
