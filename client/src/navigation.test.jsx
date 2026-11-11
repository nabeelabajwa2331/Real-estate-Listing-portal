import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import App from './App.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import { useAuth } from './context/AuthContext.jsx';

vi.mock('./context/AuthContext.jsx', () => ({
  useAuth: vi.fn(),
  homeForRole: (role) => ({ admin: '/admin', agent: '/agent', user: '/dashboard' })[role] || '/',
}));

vi.mock('./context/FavoritesContext.jsx', () => ({
  useFavorites: () => ({
    count: 0,
    items: [],
    ids: new Set(),
    loaded: true,
    error: '',
    refresh: vi.fn(),
    isFavorite: () => false,
  }),
}));

vi.mock('./context/SavedSearchesContext.jsx', () => ({
  useSavedSearches: () => ({
    count: 0,
    searches: [],
    loaded: true,
    error: '',
    refresh: vi.fn(),
    remove: vi.fn(),
    create: vi.fn(),
    saving: false,
  }),
}));

vi.mock('./context/InquiryContext.jsx', () => ({
  useInquiries: () => ({ unread: 1 }),
}));

vi.mock('./context/ChatContext.jsx', () => ({
  useChat: () => ({ unread: 1 }),
}));

vi.mock('./components/ListingMap.jsx', () => ({ default: () => null }));
vi.mock('./components/LocationPicker.jsx', () => ({ default: () => null }));

vi.mock('./api/axios.js', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    patch: vi.fn(() => Promise.resolve({ data: {} })),
  },
  errorMessage: () => 'Request failed',
}));

const renderNavbar = (role) => {
  useAuth.mockReturnValue({
    user: { id: 'user-1', name: 'Test User', email: 'test@example.com', role },
    loading: false,
    logout: vi.fn(),
  });
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={['/listings']}>
      <Navbar />
    </MemoryRouter>
  );
};

const linkFor = (html, label) => {
  const links = [...html.matchAll(/<a[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/g)];
  const match = links.find(([, , content]) =>
    content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().includes(label)
  );
  return match?.[1] || null;
};

const renderAdminDashboard = (path) =>
  renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}>
      <AdminDashboard />
    </MemoryRouter>
  );

const renderApp = (path) =>
  renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );

describe('Marketplace navbar dashboard destination', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends an admin to the Admin Dashboard and hides buyer navigation', () => {
    const html = renderNavbar('admin');

    expect(linkFor(html, 'Dashboard')).toBe('/admin');
    expect(linkFor(html, 'Browse homes')).toBe('/listings');
    expect(html).not.toContain('href="/messages"');
    expect(html).not.toContain('href="/dashboard/saved"');
    expect(html).not.toContain('href="/dashboard"');
  });

  it('sends a regular user to the User Dashboard and keeps saved items', () => {
    const html = renderNavbar('user');

    expect(linkFor(html, 'Dashboard')).toBe('/dashboard');
    expect(html).toContain('href="/dashboard/saved"');
    expect(html).toContain('href="/messages"');
    expect(html).not.toContain('href="/admin"');
  });

  it('sends an agent to the Agent Dashboard', () => {
    const html = renderNavbar('agent');

    expect(linkFor(html, 'My listings')).toBe('/agent');
    expect(linkFor(html, 'Dashboard')).toBe('/agent');
    expect(html).toContain('href="/dashboard/saved"');
    expect(html).toContain('href="/messages"');
    expect(html).not.toContain('href="/admin"');
  });
});

describe('Admin Dashboard navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      user: { id: 'admin-1', name: 'Admin', email: 'admin@example.com', role: 'admin' },
      loading: false,
      logout: vi.fn(),
    });
  });

  it('shows the required admin sidebar sections', () => {
    const html = renderAdminDashboard('/admin/messages');

    expect(linkFor(html, 'Overview')).toBe('/admin');
    expect(linkFor(html, 'Marketplace')).toBe('/');
    expect(linkFor(html, 'Users')).toBe('/admin/users');
    expect(linkFor(html, 'Agents')).toBe('/admin/agents');
    expect(linkFor(html, 'Properties')).toBe('/admin/properties');
    expect(linkFor(html, 'Messages')).toBe('/admin/messages');
  });

  it('renders Messages inside the Admin Dashboard', () => {
    const html = renderAdminDashboard('/admin/messages');

    expect(html).toContain('Send a direct message to an agent.');
    expect(html).toContain('Select an agent');
    expect(html).not.toContain('Saved searches');
  });

  it.each([
    ['/admin', 'Overview'],
    ['/admin/properties', 'Properties'],
    ['/admin/users', 'Users'],
    ['/admin/agents', 'Agents'],
    ['/admin/messages', 'Messages'],
  ])('resolves the %s route to the %s admin section', (path, title) => {
    const html = renderApp(path);

    expect(html).toMatch(new RegExp(`<h1>${title}</h1>`));
    expect(html).not.toContain('Saved searches');
    expect(html).not.toContain('Saved items');
  });

  it('does not render the admin workspace for a regular user', () => {
    useAuth.mockReturnValue({
      user: { id: 'user-1', name: 'User', email: 'user@example.com', role: 'user' },
      loading: false,
      logout: vi.fn(),
    });

    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/admin']}>
        <App />
      </MemoryRouter>
    );

    expect(html).not.toContain('Admin workspace');
    expect(html).not.toContain('Overview');
  });

  it('does not render the user workspace for an admin', () => {
    useAuth.mockReturnValue({
      user: { id: 'admin-1', name: 'Admin', email: 'admin@example.com', role: 'admin' },
      loading: false,
      logout: vi.fn(),
    });

    const html = renderApp('/dashboard');

    expect(html).not.toContain('Member workspace');
    expect(html).not.toContain('Saved searches');
    expect(html).not.toContain('Saved items');
  });
});

describe('User and Agent dashboards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps saved items and saved searches in the User Dashboard', () => {
    useAuth.mockReturnValue({
      user: { id: 'user-1', name: 'User', email: 'user@example.com', role: 'user' },
      loading: false,
      logout: vi.fn(),
    });

    const html = renderApp('/dashboard');

    expect(html).toContain('Member workspace');
    expect(html).toContain('Saved items');
    expect(html).toContain('Saved searches');
    expect(html).toContain('href="/dashboard/saved"');
    expect(html).toContain('href="/dashboard/searches"');
  });

  it('keeps the existing Agent Dashboard available', () => {
    useAuth.mockReturnValue({
      user: { id: 'agent-1', name: 'Agent', email: 'agent@example.com', role: 'agent' },
      loading: false,
      logout: vi.fn(),
    });

    const html = renderApp('/agent');

    expect(html).toContain('My listings');
    expect(html).toContain('New listing');
    expect(html).toContain('Loading your listings...');
  });
});
