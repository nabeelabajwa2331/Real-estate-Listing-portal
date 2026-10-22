import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../../api/axios.js';
import { formatPrice, propertyLabel } from '../../components/ListingCard.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { assetUrl } from '../../config/api.js';
import SmartImage from '../../components/SmartImage.jsx';

const statusTabs = [
  ['pending', 'Pending'],
  ['approved', 'Approved'],
  ['rejected', 'Rejected'],
  ['all', 'All'],
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('listings');

  return (
    <section className="dashboard">
      <header className="page-head">
        <div>
          <h1>Admin panel</h1>
          <p className="muted small">Welcome, {user.name}. Review listings and manage accounts.</p>
        </div>
      </header>

      <div className="tabs" role="tablist">
        <button
          role="tab"
          aria-selected={tab === 'listings'}
          className={tab === 'listings' ? 'tab active' : 'tab'}
          onClick={() => setTab('listings')}
        >
          Listing approval
        </button>
        <button
          role="tab"
          aria-selected={tab === 'users'}
          className={tab === 'users' ? 'tab active' : 'tab'}
          onClick={() => setTab('users')}
        >
          Users
        </button>
      </div>

      {tab === 'listings' ? <ApprovalQueue /> : <UsersPanel />}
    </section>
  );
}

function ApprovalQueue() {
  const [status, setStatus] = useState('pending');
  const [listings, setListings] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
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
    <div className="admin-panel">
      <div className="filter-chips">
        {statusTabs.map(([value, label]) => (
          <button
            key={value}
            className={status === value ? 'chip-btn active' : 'chip-btn'}
            onClick={() => setStatus(value)}
          >
            {label}
            {value !== 'all' && <span className="count">{counts[value] ?? 0}</span>}
          </button>
        ))}
      </div>

      {error && <p className="alert alert-error">{error}</p>}
      {loading && <p className="muted center">Loading listings...</p>}

      {!loading && listings.length === 0 && (
        <div className="card center empty-state">
          <h2>Nothing here</h2>
          <p className="muted">No listings with this status.</p>
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
                <p className="muted small">
                  {propertyLabel[listing.propertyType] || listing.propertyType} · {formatPrice(listing)} ·{' '}
                  {listing.address?.city}
                </p>
                <p className="muted small">
                  Agent: {listing.agent?.name} ({listing.agent?.email})
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
    <div className="admin-panel">
      <form className="filters card" onSubmit={search}>
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
        <p className="muted center">Loading users...</p>
      ) : (
        <div className="table-wrap card">
          <table className="data-table">
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
                    <td data-label="Role">{u.role}</td>
                    <td data-label="Verified">{u.isVerified ? 'Yes' : 'No'}</td>
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
