import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Avatar from './Avatar.jsx';

describe('Avatar', () => {
  it('shows the profile photo when the user has one', () => {
    render(<Avatar user={{ name: 'Sara Khan', avatar: 'https://cdn.example.com/sara.png' }} size={48} />);

    const img = screen.getByRole('img', { name: 'Sara Khan' });
    expect(img.getAttribute('src')).toBe('https://cdn.example.com/sara.png');
    expect(img.style.width).toBe('48px');
  });

  it('accepts a populated { url } avatar', () => {
    render(<Avatar user={{ name: 'Ali', avatar: { url: 'https://cdn.example.com/ali.png' } }} />);
    expect(screen.getByRole('img').getAttribute('src')).toBe('https://cdn.example.com/ali.png');
  });

  it('falls back to coloured initials without a photo', () => {
    const { container } = render(<Avatar user={{ name: 'Sara Khan' }} className="extra" />);

    const badge = container.querySelector('.avatar-initials');
    expect(badge.textContent).toBe('SK');
    expect(badge.className).toContain('extra');
    expect(badge.getAttribute('aria-hidden')).toBe('true');
    expect(badge.style.background).not.toBe('');
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('shows a placeholder for a missing user', () => {
    const { container } = render(<Avatar user={null} />);
    expect(container.querySelector('.avatar-initials').textContent).toBe('?');
  });
});
