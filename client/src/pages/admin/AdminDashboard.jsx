import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import api, { errorMessage } from '../../api/axios.js';
import { formatPrice, propertyLabel } from '../../components/ListingCard.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { assetUrl } from '../../config/api.js';
import Avatar from '../../components/Avatar.jsx';
import SmartImage from '../../components/SmartImage.jsx';

const statusTabs = [
  ['pending', 'Pending'],
  ['approved', 'Approved'],
  ['rejected', 'Rejected'],
  ['all', 'All'],
];

const iconProps = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

const icons = {
  overview: (
    <svg {...iconProps}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  listings: (
    <svg {...iconProps}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 7h6M9 11h6M9 15h4" />
    </svg>
  ),
  users: (
    <svg {...iconProps}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.5a3 3 0 0 1 0 5.8M17.5 14.2a5.5 5.5 0 0 1 3 4.8" />
    </svg>
  ),
  agents: (
    <svg {...iconProps}>
      <path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
      <path d="M16 9h2a2 2 0 0 1 2 2v10" />
      <path d="M8 7h4M8 11h4M8 15h4M8 19h4" />
    </svg>
  ),
  message: (
    <svg {...iconProps}>
      <path d="M21 12a8 8 0 0 1-8 8H6l-3 2 1-5a8 8 0 1 1 17-5z" />
    </svg>
  ),
  user: (
    <svg {...iconProps}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>
  ),
  globe: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
    </svg>
  ),
  checkCircle: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.5 2.5L16 9" />
    </svg>
  ),
  xCircle: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </svg>
  ),
  online: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
    </svg>
  ),
  menu: (
    <svg {...iconProps}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  close: (
    <svg {...iconProps}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  ),
};

const initialCounts = { pending: 0, approved: 0, rejected: 0 };

const sections = {
  overview: {
    title: 'Overview',
    subtitle: 'A snapshot of the marketplace, accounts and messages.',
  },
  properties: {
    title: 'Properties',
    subtitle: 'Review submitted listings and keep the marketplace accurate.',
  },
  users: {
    title: 'Users',
    subtitle: 'Search accounts, activate or deactivate access and see who is online.',
  },
  agents: {
    title: 'Agents',
    subtitle: 'Manage agent accounts and message them directly.',
  },
  messages: {
    title: 'Messages',
    subtitle: 'Send individual messages to agents and review past conversations.',
  },
};

const sectionFromPath = (pathname) => {
  const path = pathname.replace(/\/+$/, '');
  if (path === '/admin/properties') return 'properties';
  if (path === '/admin/users') return 'users';
  if (path === '/admin/agents') return 'agents';
  if (path === '/admin/messages') return 'messages';
  return 'overview';
};

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [listingCounts, setListingCounts] = useState(initialCounts);
  const section = sectionFromPath(location.pathname);
  const meta = sections[section];

  useEffect(() => {
    if (section === 'properties') return undefined;
    let active = true;
    api
      .get('/admin/listings', { params: { status: 'pending' } })
      .then((res) => {
        if (active) setListingCounts(res.data.counts);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [section]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const onLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/');
  };

  return (
    <section className={menuOpen ? 'admin-shell admin-shell-open' : 'admin-shell'}>
      <aside id="admin-sidebar" className="admin-sidebar" aria-label="Admin sidebar">
        <div className="admin-sidebar-head">
          <Link to="/admin" className="admin-brand" onClick={() => setMenuOpen(false)}>
            <span className="admin-brand-mark" aria-hidden="true">
              RE
            </span>
            <span className="admin-brand-copy">
              <span className="admin-brand-title">RealEstate</span>
              <span className="admin-brand-sub">Admin workspace</span>
            </span>
          </Link>
          <button
            type="button"
            className="admin-close"
            aria-label="Close admin menu"
            onClick={() => setMenuOpen(false)}
          >
            {icons.close}
          </button>
        </div>

        <div className="admin-nav-group">
          <p className="admin-nav-label">Workspace</p>
          <nav className="admin-nav" aria-label="Admin sections">
            <NavLink
              to="/admin"
              end
              className={({ isActive }) => (isActive ? 'admin-nav-item active' : 'admin-nav-item')}
            >
              <span className="admin-nav-icon">{icons.overview}</span>
              <span className="admin-nav-text">Overview</span>
            </NavLink>
            <Link to="/" className="admin-nav-item" onClick={() => setMenuOpen(false)}>
              <span className="admin-nav-icon">{icons.globe}</span>
              <span className="admin-nav-text">Marketplace</span>
            </Link>
            <NavLink
              to="/admin/users"
              className={({ isActive }) => (isActive ? 'admin-nav-item active' : 'admin-nav-item')}
            >
              <span className="admin-nav-icon">{icons.users}</span>
              <span className="admin-nav-text">Users</span>
            </NavLink>
            <NavLink
              to="/admin/agents"
              className={({ isActive }) => (isActive ? 'admin-nav-item active' : 'admin-nav-item')}
            >
              <span className="admin-nav-icon">{icons.agents}</span>
              <span className="admin-nav-text">Agents</span>
            </NavLink>
            <NavLink
              to="/admin/properties"
              className={({ isActive }) => (isActive ? 'admin-nav-item active' : 'admin-nav-item')}
            >
              <span className="admin-nav-icon">{icons.listings}</span>
              <span className="admin-nav-text">Properties</span>
              {listingCounts.pending > 0 && (
                <span className="admin-nav-count">{listingCounts.pending}</span>
              )}
            </NavLink>
            <NavLink
              to="/admin/messages"
              className={({ isActive }) => (isActive ? 'admin-nav-item active' : 'admin-nav-item')}
            >
              <span className="admin-nav-icon">{icons.message}</span>
              <span className="admin-nav-text">Messages</span>
            </NavLink>
          </nav>
        </div>

        <div className="admin-sidebar-foot">
          <span className="admin-sidebar-badge">Administrator</span>
          <div className="admin-sidebar-user">
            <Avatar user={user} size={34} />
            <span>
              <strong>{user.name}</strong>
              <small>{user.email}</small>
            </span>
          </div>
          <NavLink to="/profile" className="admin-side-link">
            <span className="admin-nav-icon">{icons.user}</span>
            <span>Profile</span>
          </NavLink>
          <button type="button" className="admin-signout" onClick={onLogout}>
            Sign out
          </button>
        </div>
      </aside>

      {menuOpen && (
        <button
          type="button"
          className="admin-scrim"
          aria-label="Close admin menu"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div className="admin-main">
        <div className="admin-mobile-bar">
          <button
            type="button"
            className="admin-menu-btn"
            aria-expanded={menuOpen}
            aria-controls="admin-sidebar"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {icons.menu}
            <span>Admin menu</span>
          </button>
          <span className="admin-mobile-title">Admin dashboard</span>
          <Link to="/profile" className="admin-mobile-avatar" aria-label="Profile settings">
            <Avatar user={user} size={30} />
          </Link>
        </div>

        <div className="admin-content">
          <header className="dash-page-head admin-page-head">
            <div>
              <p className="dash-eyebrow">Admin</p>
              <h1>{meta.title}</h1>
              <p className="muted">{meta.subtitle}</p>
            </div>
          </header>

          {section === 'overview' && <AdminOverview counts={listingCounts} />}
          {section === 'properties' && <ApprovalQueue onCountsChange={setListingCounts} />}
          {section === 'users' && <UsersPanel />}
          {section === 'agents' && <UsersPanel fixedRole="agent" />}
          {section === 'messages' && <AdminMessages />}
        </div>
      </div>
    </section>
  );
}

function AdminOverview({ counts }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api
      .get('/admin/users')
      .then(({ data }) => {
        if (!active) return;
        const users = data.users || [];
        setStats({
          total: users.length,
          agents: users.filter((u) => u.role === 'agent').length,
          online: data.onlineCount ?? users.filter((u) => u.isOnline).length,
        });
      })
      .catch((err) => active && setError(errorMessage(err)));
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="dash-page">
      {error && <p className="alert alert-error">{error}</p>}

      <div className="dash-metrics">
        <Link to="/admin/properties" className="card dash-metric">
          <span className="dash-metric-icon">{icons.listings}</span>
          <span className="dash-metric-copy">
            <span className="dash-metric-value">{counts.pending}</span>
            <span className="dash-metric-label">Pending review</span>
          </span>
        </Link>
        <div className="card dash-metric">
          <span className="dash-metric-icon">{icons.checkCircle}</span>
          <span className="dash-metric-copy">
            <span className="dash-metric-value">{counts.approved}</span>
            <span className="dash-metric-label">Approved</span>
          </span>
        </div>
        <div className="card dash-metric">
          <span className="dash-metric-icon">{icons.xCircle}</span>
          <span className="dash-metric-copy">
            <span className="dash-metric-value">{counts.rejected}</span>
            <span className="dash-metric-label">Rejected</span>
          </span>
        </div>
        <Link to="/admin/users" className="card dash-metric">
          <span className="dash-metric-icon">{icons.users}</span>
          <span className="dash-metric-copy">
            <span className="dash-metric-value">{stats ? stats.total : '—'}</span>
            <span className="dash-metric-label">Total users</span>
          </span>
        </Link>
        <Link to="/admin/agents" className="card dash-metric">
          <span className="dash-metric-icon">{icons.agents}</span>
          <span className="dash-metric-copy">
            <span className="dash-metric-value">{stats ? stats.agents : '—'}</span>
            <span className="dash-metric-label">Agents</span>
          </span>
        </Link>
        <Link to="/admin/messages" className="card dash-metric">
          <span className="dash-metric-icon">{icons.online}</span>
          <span className="dash-metric-copy">
            <span className="dash-metric-value">{stats ? stats.online : '—'}</span>
            <span className="dash-metric-label">Online now</span>
          </span>
        </Link>
      </div>

      <div className="dash-content-grid">
        <section className="card dash-panel">
          <div className="dash-section-head">
            <div>
              <h2>Approval queue</h2>
              <p className="muted small">Keep the marketplace accurate.</p>
            </div>
            <Link to="/admin/properties" className="dash-panel-link">
              Open queue
            </Link>
          </div>
          <p className="muted">
            {counts.pending > 0
              ? `${counts.pending} ${counts.pending === 1 ? 'property is' : 'properties are'} waiting for review.`
              : 'No properties are waiting for review.'}
          </p>
        </section>

        <section className="card dash-panel">
          <div className="dash-section-head">
            <div>
              <h2>Quick actions</h2>
              <p className="muted small">Go straight to the area you need.</p>
            </div>
          </div>
          <div className="admin-quick-links">
            <Link to="/admin/properties" className="btn">
              Review properties
            </Link>
            <Link to="/admin/users" className="btn">
              Manage users
            </Link>
            <Link to="/admin/agents" className="btn">
              Manage agents
            </Link>
            <Link to="/admin/messages" className="btn">
              Message agents
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function ApprovalQueue({ onCountsChange }) {
  const [status, setStatus] = useState('pending');
  const [listings, setListings] = useState([]);
  const [counts, setCounts] = useState(initialCounts);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rejectingId, setRejectingId] = useState(null);
  const [reason, setReason] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = async (nextStatus = status) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/admin/listings', { params: { status: nextStatus } });
      setListings(data.listings);
      setCounts(data.counts);
      onCountsChange?.(data.counts);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const decide = async (listing, action, body) => {
    setBusyId(listing._id);
    setError('');
    try {
      await api.patch(`/admin/listings/${listing._id}/${action}`, body);
      setRejectingId(null);
      setReason('');
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="admin-panel admin-queue" role="region" aria-label="Property approval">
      <div className="admin-panel-head">
        <div>
          <h2>Property approval</h2>
          <p className="muted small">Open a listing, then approve or reject it with a reason.</p>
        </div>
      </div>

      <div className="filter-chips" role="group" aria-label="Filter listings by status">
        {statusTabs.map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={status === value ? 'chip-btn active' : 'chip-btn'}
            onClick={() => setStatus(value)}
          >
            {label}
            {value !== 'all' && <span className="count">{counts[value] ?? 0}</span>}
          </button>
        ))}
      </div>

      {error && <p className="alert alert-error">{error}</p>}
      {loading && <p className="muted dash-loading">Loading listings...</p>}

      {!loading && !error && listings.length === 0 && (
        <div className="card admin-empty-state">
          <h2>{status === 'all' ? 'No listings yet' : `No ${status} listings`}</h2>
          <p className="muted">
            {status === 'all'
              ? 'No listings have been submitted yet.'
              : `There are no ${status} listings right now.`}
          </p>
        </div>
      )}

      {!loading && listings.length > 0 && (
        <div className="review-list">
          {listings.map((listing) => (
            <article className="card review-card" key={listing._id}>
              <div className="review-media">
                <SmartImage
                  src={listing.images?.[0]?.url ? assetUrl(listing.images[0].url) : undefined}
                  alt=""
                  loading="lazy"
                />
              </div>

              <div className="review-body">
                <div className="review-title">
                  <Link to={`/listings/${listing._id}`} className="table-title">
                    {listing.title}
                  </Link>
                  <span className={`status status-${listing.status}`}>{listing.status}</span>
                </div>

                <div className="admin-review-meta">
                  <span>{propertyLabel[listing.propertyType] || listing.propertyType}</span>
                  <span>{formatPrice(listing)}</span>
                  {listing.address?.city && <span>{listing.address.city}</span>}
                </div>

                <p className="admin-review-agent">
                  Agent: <strong>{listing.agent?.name}</strong>{' '}
                  <span>{listing.agent?.email}</span>
                </p>

                {listing.status === 'rejected' && listing.rejectionReason && (
                  <p className="reject-note">Reason: {listing.rejectionReason}</p>
                )}

                {rejectingId === listing._id ? (
                  <div className="reject-box">
                    <textarea
                      rows={2}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Why is this listing rejected? (required)"
                      autoFocus
                    />
                    <div className="reject-actions">
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        disabled={busyId === listing._id || reason.trim().length < 3}
                        onClick={() => decide(listing, 'reject', { reason })}
                      >
                        {busyId === listing._id ? 'Saving...' : 'Confirm rejection'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm"
                        disabled={busyId === listing._id}
                        onClick={() => {
                          setRejectingId(null);
                          setReason('');
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="review-actions">
                    {listing.status !== 'approved' && (
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        disabled={busyId === listing._id}
                        onClick={() => decide(listing, 'approve')}
                      >
                        Approve
                      </button>
                    )}
                    {listing.status !== 'rejected' && (
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        disabled={busyId === listing._id}
                        onClick={() => {
                          setRejectingId(listing._id);
                          setReason('');
                        }}
                      >
                        Reject
                      </button>
                    )}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function UsersPanel({ fixedRole = '' }) {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const paramsRef = useRef({ q: '', role: fixedRole });

  const load = async (params = paramsRef.current, silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/admin/users', { params });
      setUsers(data.users);
      setOnlineCount(data.onlineCount ?? 0);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const timer = setInterval(() => load(paramsRef.current, true), 30000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const search = (e) => {
    e.preventDefault();
    paramsRef.current = { q: query, role: fixedRole || role };
    load(paramsRef.current);
  };

  const toggle = async (u) => {
    setBusyId(u.id);
    setError('');
    try {
      const action = u.isActive ? 'deactivate' : 'activate';
      const { data } = await api.patch(`/admin/users/${u.id}/${action}`);
      setUsers((list) =>
        list.map((item) =>
          item.id === u.id
            ? { ...data.user, isOnline: action === 'deactivate' ? false : item.isOnline }
            : item
        )
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const isAgents = fixedRole === 'agent';

  return (
    <div className="admin-panel admin-users" role="region" aria-label={isAgents ? 'Agents' : 'Users'}>
      <div className="admin-panel-head">
        <div>
          <h2>{isAgents ? 'Agent accounts' : 'User accounts'}</h2>
          <p className="muted small">
            {isAgents
              ? 'Search agents and control their access.'
              : 'Search accounts and control access.'}
          </p>
        </div>
        <span className="admin-online-badge">
          <span className="admin-online-dot" aria-hidden="true" />
          {onlineCount} online
        </span>
      </div>

      <form className={isAgents ? 'filters card admin-filters admin-filters-fixed' : 'filters card admin-filters'} onSubmit={search}>
        <label>
          Search
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name or email" />
        </label>
        {!isAgents && (
          <label>
            Role
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="">All roles</option>
              <option value="user">Buyer / renter</option>
              <option value="agent">Agent</option>
              <option value="admin">Admin</option>
            </select>
          </label>
        )}
        <button className="btn btn-primary">Search</button>
      </form>

      {error && <p className="alert alert-error">{error}</p>}

      {loading ? (
        <p className="muted dash-loading">Loading {isAgents ? 'agents' : 'users'}...</p>
      ) : users.length === 0 ? (
        !error && (
          <div className="card admin-empty-state">
            <h2>{isAgents ? 'No agents found' : 'No users found'}</h2>
            <p className="muted">Try a different search or role filter.</p>
          </div>
        )
      ) : (
        <div className="table-wrap card admin-table-wrap">
          <table className="data-table admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Online</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.id === me.id;
                return (
                  <tr key={u.id}>
                    <td className="table-title">
                      {u.name}
                      {isSelf && <span className="muted small"> (you)</span>}
                    </td>
                    <td data-label="Email">{u.email}</td>
                    <td data-label="Role">
                      <span className="admin-role">{u.role}</span>
                    </td>
                    <td data-label="Online">
                      <span className={u.isOnline ? 'admin-online' : 'admin-offline'}>
                        <span className="admin-online-dot" aria-hidden="true" />
                        {u.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td data-label="Status">
                      <span className={u.isActive ? 'status status-approved' : 'status status-rejected'}>
                        {u.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="table-actions">
                      <button
                        type="button"
                        className={u.isActive ? 'btn btn-sm btn-danger' : 'btn btn-sm btn-primary'}
                        disabled={isSelf || busyId === u.id}
                        title={isSelf ? 'You cannot change your own status' : undefined}
                        onClick={() => toggle(u)}
                      >
                        {busyId === u.id ? 'Saving...' : u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AdminMessages() {
  const { user } = useAuth();
  const [agents, setAgents] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [filter, setFilter] = useState('');
  const [activeAgentId, setActiveAgentId] = useState(null);
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const threadRef = useRef(null);

  const loadInbox = async () => {
    const [agentsRes, conversationsRes] = await Promise.all([
      api.get('/admin/users', { params: { role: 'agent' } }),
      api.get('/chat/conversations'),
    ]);
    setAgents(agentsRes.data.users || []);
    setConversations(conversationsRes.data.conversations || []);
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadInbox()
      .catch((err) => active && setError(errorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [thread]);

  const openAgent = async (agent) => {
    if (!agent.isActive) return;
    setError('');
    setThreadLoading(true);
    setActiveAgentId(agent.id);
    try {
      const { data } = await api.post('/chat/conversations', { userId: agent.id });
      const { data: threadData } = await api.get(`/chat/conversations/${data.conversation.id}`);
      setThread(threadData.conversation);
      await loadInbox();
    } catch (err) {
      setError(errorMessage(err));
      setThread(null);
    } finally {
      setThreadLoading(false);
    }
  };

  const openConversation = async (conversation) => {
    setError('');
    setThreadLoading(true);
    setActiveAgentId(conversation.user?.id || null);
    try {
      const { data } = await api.get(`/chat/conversations/${conversation.id}`);
      setThread(data.conversation);
    } catch (err) {
      setError(errorMessage(err));
      setThread(null);
    } finally {
      setThreadLoading(false);
    }
  };

  const refreshThread = async () => {
    if (!thread) return;
    setThreadLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/chat/conversations/${thread.id}`);
      setThread(data.conversation);
      await loadInbox();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setThreadLoading(false);
    }
  };

  const send = async (e) => {
    e.preventDefault();
    if (!thread || !draft.trim() || sending) return;
    setSending(true);
    setError('');
    try {
      await api.post(`/chat/conversations/${thread.id}/messages`, { body: draft });
      const { data } = await api.get(`/chat/conversations/${thread.id}`);
      setThread(data.conversation);
      setDraft('');
      await loadInbox();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const visibleAgents = agents.filter((agent) => {
    if (!filter.trim()) return true;
    const haystack = `${agent.name} ${agent.email}`.toLowerCase();
    return haystack.includes(filter.trim().toLowerCase());
  });

  const activeAgent = agents.find((agent) => agent.id === activeAgentId);
  const activeMessages = thread?.messages || [];
  const activeName = activeAgent?.name || thread?.user?.name || 'Agent';
  const activeEmail = activeAgent?.email || '';

  return (
    <div className="admin-messages">
      <aside className="card admin-msg-side">
        <div className="admin-msg-side-head">
          <h2>Agents</h2>
          <p className="muted small">Send a direct message to an agent.</p>
        </div>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search agents"
          aria-label="Search agents"
        />

        {loading ? (
          <p className="muted dash-loading">Loading agents...</p>
        ) : visibleAgents.length === 0 ? (
          <p className="muted small">No agents found.</p>
        ) : (
          <ul className="admin-msg-list">
            {visibleAgents.map((agent) => {
              const conversation = conversations.find((item) => item.user?.id === agent.id);
              return (
                <li key={agent.id}>
                  <button
                    type="button"
                    className={activeAgentId === agent.id ? 'admin-msg-item active' : 'admin-msg-item'}
                    disabled={!agent.isActive}
                    onClick={() => openAgent(agent)}
                  >
                    <Avatar user={agent} size={36} />
                    <span className="admin-msg-item-main">
                      <span className="admin-msg-item-top">
                        <span className="admin-msg-item-name">
                          {agent.name}
                          {agent.isOnline && <span className="admin-online-dot" aria-hidden="true" />}
                        </span>
                        {conversation?.unread > 0 && (
                          <span className="unread-badge">{conversation.unread}</span>
                        )}
                      </span>
                      <span className="admin-msg-item-preview">
                        {!agent.isActive
                          ? 'Account deactivated'
                          : conversation?.lastMessage?.body || agent.email}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </aside>

      <section className="card admin-msg-main">
        {error && <p className="alert alert-error admin-msg-alert">{error}</p>}

        {threadLoading ? (
          <p className="muted center admin-msg-empty">Loading conversation...</p>
        ) : thread ? (
          <>
            <header className="admin-msg-head">
              <Avatar user={activeAgent || thread.user} size={38} />
              <div className="admin-msg-head-copy">
                <strong>{activeName}</strong>
                <p className="muted small">{activeEmail || thread.user?.role || 'Agent'}</p>
              </div>
              <button
                type="button"
                className="btn btn-sm admin-msg-refresh"
                onClick={refreshThread}
                disabled={threadLoading}
              >
                Refresh
              </button>
            </header>

            <div className="msg-messages admin-msg-thread" ref={threadRef}>
              {activeMessages.length === 0 && (
                <p className="muted small msg-hint">No messages yet — write the first one below.</p>
              )}
              {activeMessages.map((msg, index) => {
                const mine = String(msg.sender?._id) === user.id;
                return (
                  <div key={msg._id || index} className={mine ? 'msg-row mine' : 'msg-row'}>
                    {!mine && <Avatar user={msg.sender} size={24} />}
                    <div className={mine ? 'msg-bubble mine' : 'msg-bubble'}>
                      <p>{msg.body}</p>
                      <span className="msg-time">
                        {new Date(msg.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <form className="msg-compose" onSubmit={send}>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a message..."
                maxLength={2000}
                aria-label="Message"
              />
              <button className="btn btn-primary" disabled={sending || !draft.trim()}>
                {sending ? 'Sending...' : 'Send'}
              </button>
            </form>
          </>
        ) : (
          <div className="msg-empty admin-msg-empty">
            <h2>Select an agent</h2>
            <p className="muted">Choose an agent from the list to start a conversation.</p>
            <p className="muted small">Previously sent messages appear here when you reopen the chat.</p>
          </div>
        )}
      </section>
    </div>
  );
}
