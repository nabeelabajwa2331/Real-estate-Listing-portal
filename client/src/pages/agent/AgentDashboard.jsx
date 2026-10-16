import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../../api/axios.js';
import { formatPrice, propertyLabel } from '../../components/ListingCard.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useInquiries } from '../../context/InquiryContext.jsx';

const statusLabel = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' };

export default function AgentDashboard() {
  const { user } = useAuth();
  const { unread } = useInquiries();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/listings/mine');
      setListings(data.listings);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (listing) => {
    if (!window.confirm(`Delete "${listing.title}"? This cannot be undone.`)) return;
    setBusyId(listing._id);
    setError('');
    try {
      await api.delete(`/listings/${listing._id}`);
      setListings((items) => items.filter((item) => item._id !== listing._id));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="dashboard">
      <header className="page-head">
        <div>
          <h1>My listings</h1>
          <p className="muted small">
            Welcome, {user.name}. Manage the properties you have published.
          </p>
        </div>
        <div className="head-actions">
          <Link to="/inbox" className="btn">
            Inquiries
            {unread > 0 && <span className="nav-badge">{unread}</span>}
          </Link>
          <Link to="/agent/new" className="btn btn-primary">
            + New listing
          </Link>
        </div>
      </header>

      {error && <p className="alert alert-error">{error}</p>}

      {loading ? (
        <p className="muted center">Loading your listings...</p>
      ) : listings.length === 0 ? (
        <div className="card center empty-state">
          <h2>No listings yet</h2>
          <p className="muted">Publish your first property to get started.</p>
          <Link to="/agent/new" className="btn btn-primary">
            Create a listing
          </Link>
        </div>
      ) : (
        <div className="table-wrap card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Price</th>
                <th>Type</th>
                <th>Status</th>
                <th>Views</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => (
                <tr key={listing._id}>
                  <td>
                    <Link to={`/listings/${listing._id}`} className="table-title">
                      {listing.title}
                    </Link>
                    <span className="muted small block">{listing.address?.city}</span>
                    {listing.status === 'rejected' && listing.rejectionReason && (
                      <span className="reject-note">Reason: {listing.rejectionReason}</span>
                    )}
                  </td>
                  <td>{formatPrice(listing)}</td>
                  <td>{propertyLabel[listing.propertyType] || listing.propertyType}</td>
                  <td>
                    <span className={`status status-${listing.status}`}>{statusLabel[listing.status]}</span>
                  </td>
                  <td>{listing.views}</td>
                  <td className="table-actions">
                    <Link to={`/agent/${listing._id}/edit`} className="btn btn-sm">
                      Edit
                    </Link>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      disabled={busyId === listing._id}
                      onClick={() => remove(listing)}
                    >
                      {busyId === listing._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
