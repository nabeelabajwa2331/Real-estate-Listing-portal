import { describe, it, expect } from 'vitest';
import { initialsOf, colorFor, avatarUrl, AVATAR_PALETTE } from './avatar.js';

describe('initialsOf', () => {
  it('uses the first letters of the first two words', () => {
    expect(initialsOf('Ayesha Khan')).toBe('AK');
    expect(initialsOf('  John   Ronald  Tolkien ')).toBe('JR');
  });

  it('handles single names and empties', () => {
    expect(initialsOf('Madonna')).toBe('M');
    expect(initialsOf('')).toBe('?');
    expect(initialsOf(undefined)).toBe('?');
  });
});

describe('colorFor', () => {
  it('is deterministic and always in the palette', () => {
    expect(colorFor('Ayesha Khan')).toBe(colorFor('Ayesha Khan'));
    expect(AVATAR_PALETTE).toContain(colorFor('Ayesha Khan'));
    expect(AVATAR_PALETTE).toContain(colorFor(''));
  });
});

describe('avatarUrl', () => {
  it('handles string, nested object and missing avatars', () => {
    expect(avatarUrl({ avatar: '/uploads/a.png' })).toBe('/uploads/a.png');
    expect(avatarUrl({ avatar: { url: '/uploads/b.png' } })).toBe('/uploads/b.png');
    expect(avatarUrl({})).toBe(null);
    expect(avatarUrl(undefined)).toBe(null);
  });
});
