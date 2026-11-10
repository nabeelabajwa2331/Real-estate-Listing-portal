import { useEffect, useState } from 'react';
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
  clock: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
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
  check: (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m4 12 5 5L20 6" />
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

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [listingCounts, setListingCounts] = useState(initialCounts);

  // Admin sections are real URLs so refresh, deep links and the browser back
  // button all work. /admin is the listing approval section.
  const normalizedPath = location.pathname.replace(/\/+$/, '');
  const tab = normalizedPath === '/admin/users' ? 'users' : 'listings';

  useEffect(() => {
    let active = true;
    api
      .get('/admin/listings', { params: { status: 'pending' } })
      .then((res) => active && setListingCounts(res.data.counts))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

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
          <p className="admin-nav-label">Management</p>
          <nav className="admin-nav" aria-label="Admin sections">
            <NavLink
              to="/admin"
              end
              className={({ isActive }) => (isActive ? 'admin-nav-item active' : 'admin-nav-item')}
            >
              <span className="admin-nav-icon">{icons.listings}</span>
              <span className="admin-nav-text">Listing approval</span>
              {listingCounts.pending > 0 && (
                <span className="admin-nav-count">{listingCounts.pending}</span>
              )}
            </NavLink>
            <NavLink
              to="/admin/users"
              className={({ isActive }) => (isActive ? 'admin-nav-item active' : 'admin-nav-item')}
            >
              <span className="admin-nav-icon">{icons.users}</span>
              <span className="admin-nav-text">Users</span>
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
          <Link to="/" className="admin-side-link">
            <span className="admin-nav-icon">{icons.globe}</span>
            <span>View marketplace</span>
          </Link>
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
              <p className="dash-eyebrow">Management</p>
              <h1>{tab === 'users' ? 'User management' : 'Admin dashboard'}</h1>
              <p className="muted">
                {tab === 'users'
                  ? 'Search accounts, verify roles and control access.'
                  : 'Review submitted listings and keep the marketplace accurate.'}
              </p>
            </div>
            <div className="dash-page-actions">
              <Link to="/" className="btn">
                View marketplace
              </Link>
            </div>
          </header>

          {tab === 'listings' ? (
            <>
              <div className="admin-stats" aria-label="Listing statistics">
                <article className="card admin-stat">
                  <span className="admin-stat-icon admin-stat-pending">{icons.clock}</span>
                  <span className="admin-stat-copy">
                    <strong>{listingCounts.pending}</strong>
                    <span>Pending review</span>
                  </span>
                </article>
                <article className="card admin-stat">
                  <span className="admin-stat-icon admin-stat-approved">{icons.checkCircle}</span>
                  <span className="admin-stat-copy">
                    <strong>{listingCounts.approved}</strong>
                    <span>Approved</span>
                  </span>
                </article>
                <article className="card admin-stat">
                  <span className="admin-stat-icon admin-stat-rejected">{icons.xCircle}</span>
                  <span className="admin-stat-copy">
                    <strong>{listingCounts.rejected}</strong>
                    <span>Rejected</span>
                  </span>
                </article>
              </div>
              <ApprovalQueue onCountsChange={setListingCounts} />
            </>
          ) : (
            <UsersPanel />
          )}
        </div>
      </div>
    </section>
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
    <div className="admin-panel admin-queue" role="region" aria-label="Listing approval">
      <div className="admin-panel-head">
        <div>
          <h2>Listing approval</h2>
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

function UsersPanel() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = async (params = {}) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/admin/users', { params });
      setUsers(data.users);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const search = (e) => {
    e.preventDefault();
    load({ q: query, role });
  };

  const toggle = async (u) => {
    setBusyId(u.id);
    setError('');
    try {
      const action = u.isActive ? 'deactivate' : 'activate';
      const { data } = await api.patch(`/admin/users/${u.id}/${action}`);
      setUsers((list) => list.map((item) => (item.id === u.id ? data.user : item)));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="admin-panel admin-users" role="region" aria-label="User management">
      <div className="admin-panel-head">
        <div>
          <h2>User accounts</h2>
          <p className="muted small">Search accounts and control access.</p>
        </div>
      </div>

      <form className="filters card admin-filters" onSubmit={search}>
        <label>
          Search
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name or email" />
        </label>
        <label>
          Role
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">All roles</option>
            <option value="user">Buyer / renter</option>
            <option value="agent">Agent</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <button className="btn btn-primary">Search</button>
      </form>

      {error && <p className="alert alert-error">{error}</p>}

      {loading ? (
        <p className="muted dash-loading">Loading users...</p>
      ) : users.length === 0 ? (
        !error && (
          <div className="card admin-empty-state">
            <h2>No users found</h2>
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
                <th>Verified</th>
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
                    <td data-label="Verified">
                      {u.isVerified ? (
                        <span className="admin-verified">
                          <span className="admin-check" aria-hidden="true">
                            {icons.check}
                          </span>
                          Verified
                        </span>
                      ) : (
                        <span className="admin-unverified">Not verified</span>
                      )}
                    </td>
                    <td data-label="Status">
                      <span className={u.isActive ? 'status status-approved' : 'status status-rejected'}>
                        {u.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="table-actions">
                      <button
                        type="button"
                        className={u.isActive ? 'btn btn-sm btn-danger' : 'btn btn-sm'}
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
