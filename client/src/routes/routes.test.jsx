import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute.jsx';
import RoleRoute from './RoleRoute.jsx';
import { useAuth } from '../context/AuthContext.jsx';

vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: vi.fn(),
  homeForRole: (role) => ({ admin: '/admin', agent: '/agent', user: '/dashboard' })[role] || '/',
}));

function Where() {
  const location = useLocation();
  return <p data-testid="where">{`${location.pathname}${location.search}`}</p>;
}

const renderAt = (path, guard) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={guard}>
          <Route path="/secret" element={<h1>Secret page</h1>} />
        </Route>
        <Route path="*" element={<Where />} />
      </Routes>
    </MemoryRouter>
  );

describe('ProtectedRoute', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows a session check while auth is loading', () => {
    useAuth.mockReturnValue({ user: null, loading: true });
    renderAt('/secret', <ProtectedRoute />);
    expect(screen.getByRole('status').textContent).toMatch(/checking your session/i);
  });

  it('sends guests to login and remembers where they were going', () => {
    useAuth.mockReturnValue({ user: null, loading: false });
    renderAt('/secret?tab=2', <ProtectedRoute />);
    expect(screen.getByTestId('where').textContent).toBe(
      `/login?next=${encodeURIComponent('/secret?tab=2')}`
    );
  });

  it('lets signed-in users through', () => {
    useAuth.mockReturnValue({ user: { id: 'u1', role: 'user' }, loading: false });
    renderAt('/secret', <ProtectedRoute />);
    expect(screen.getByRole('heading', { name: 'Secret page' })).toBeTruthy();
  });
});

describe('RoleRoute', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sends guests to login', () => {
    useAuth.mockReturnValue({ user: null, loading: false });
    renderAt('/secret', <RoleRoute roles={['admin']} />);
    expect(screen.getByTestId('where').textContent).toBe('/login?next=%2Fsecret');
  });

  it('lets users with an allowed role through', () => {
    useAuth.mockReturnValue({ user: { id: 'a1', role: 'admin' }, loading: false });
    renderAt('/secret', <RoleRoute roles={['admin']} />);
    expect(screen.getByRole('heading', { name: 'Secret page' })).toBeTruthy();
  });

  it.each([
    ['user', '/dashboard'],
    ['agent', '/agent'],
  ])('redirects a %s without the role to their own home (%s)', (role, home) => {
    useAuth.mockReturnValue({ user: { id: 'x', role }, loading: false });
    renderAt('/secret', <RoleRoute roles={['admin']} />);
    expect(screen.getByTestId('where').textContent).toBe(home);
  });
});
