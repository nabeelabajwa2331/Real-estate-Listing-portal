// Pure image-signature helpers. Kept separate from upload.js so they can be
// unit-tested without loading Sharp or any native module.

const startsWith = (buffer, bytes) =>
  buffer.length >= bytes.length && bytes.every((byte, index) => buffer[index] === byte);

const ascii = (buffer, start, length) =>
  buffer.length >= start + length ? buffer.subarray(start, start + length).toString('ascii') : '';

// Returns 'jpeg' | 'png' | 'webp' | null. The client-provided MIME type and
// filename are never trusted; this inspects the actual bytes.
export const detectImageType = (buffer) => {
  if (!buffer || buffer.length < 12) return null;

  if (startsWith(buffer, [0xff, 0xd8, 0xff])) return 'jpeg';
  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';
  if (ascii(buffer, 0, 4) === 'RIFF' && ascii(buffer, 8, 4) === 'WEBP') return 'webp';

  return null;
};

// SVG is deliberately rejected: it is an executable document, not a bitmap,
// and can carry scripts when served from the same origin.
export const looksLikeSvg = (buffer) => {
  if (!buffer) return false;
  const head = buffer.subarray(0, Math.min(buffer.length, 512)).toString('utf8').trim().toLowerCase();
  return head.startsWith('<svg') || head.startsWith('<?xml') || head.includes('<svg');
};

export const ALLOWED_IMAGE_TYPES = ['jpeg', 'png', 'webp'];

export const isAllowedImage = (buffer) =>
  !looksLikeSvg(buffer) && ALLOWED_IMAGE_TYPES.includes(detectImageType(buffer));
