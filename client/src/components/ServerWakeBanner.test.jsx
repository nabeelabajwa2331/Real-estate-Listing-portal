import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import ServerWakeBanner from './ServerWakeBanner.jsx';
import { useServerStatusStore } from '../store/serverStatusStore.js';

describe('ServerWakeBanner', () => {
  beforeEach(() => {
    useServerStatusStore.setState({ slowRequests: 0, recovered: false });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stays hidden while requests are fast', () => {
    const { container } = render(<ServerWakeBanner />);
    expect(container.innerHTML).toBe('');
  });

  it('explains the cold start while a request is slow', () => {
    render(<ServerWakeBanner />);
    act(() => useServerStatusStore.getState().markSlow());
    expect(screen.getByRole('status').textContent).toMatch(/waking up the server/i);
  });

  it('confirms recovery, then hides itself', () => {
    vi.useFakeTimers();
    render(<ServerWakeBanner />);

    act(() => useServerStatusStore.getState().markSlow());
    act(() => useServerStatusStore.getState().markDone(true));
    expect(screen.getByRole('status').textContent).toMatch(/connected/i);

    act(() => vi.advanceTimersByTime(3000));
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('does not claim recovery when the slow request failed', () => {
    const { container } = render(<ServerWakeBanner />);
    act(() => useServerStatusStore.getState().markSlow());
    act(() => useServerStatusStore.getState().markDone(false));
    expect(container.innerHTML).toBe('');
  });
});
