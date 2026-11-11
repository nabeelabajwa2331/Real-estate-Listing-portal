import { describe, expect, it } from 'vitest';
import { loginPath, registerPath, safeNextPath } from './redirect.js';

describe('safeNextPath', () => {
  it('accepts same-origin absolute paths', () => {
    expect(safeNextPath('/listings?city=Lahore')).toBe('/listings?city=Lahore');
    expect(safeNextPath('/dashboard/saved')).toBe('/dashboard/saved');
  });

  it('rejects open redirects and non-path values', () => {
    expect(safeNextPath('//evil.example')).toBeNull();
    expect(safeNextPath('/\\evil.example')).toBeNull();
    expect(safeNextPath('https://evil.example')).toBeNull();
    expect(safeNextPath('javascript:alert(1)')).toBeNull();
    expect(safeNextPath('listings')).toBeNull();
    expect(safeNextPath('')).toBeNull();
    expect(safeNextPath(null)).toBeNull();
  });

  it('rejects control characters', () => {
    expect(safeNextPath('/listings\nhttp://evil.example')).toBeNull();
  });

  it('does not loop back to auth screens', () => {
    expect(safeNextPath('/login')).toBeNull();
    expect(safeNextPath('/register?next=/listings')).toBeNull();
  });
});

describe('login and register links', () => {
  it('encodes a safe destination', () => {
    expect(loginPath('/listings?city=Lahore')).toBe('/login?next=%2Flistings%3Fcity%3DLahore');
    expect(registerPath('/dashboard/saved')).toBe('/register?next=%2Fdashboard%2Fsaved');
  });

  it('falls back to the plain path for an unsafe destination', () => {
    expect(loginPath('//evil.example')).toBe('/login');
    expect(registerPath(null)).toBe('/register');
  });
});
