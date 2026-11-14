import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Vitest runs without globals, so React Testing Library cannot register its
// automatic cleanup. Unmount rendered trees between tests explicitly.
afterEach(() => {
  cleanup();
});
