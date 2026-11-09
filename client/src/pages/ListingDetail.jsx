import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { errorMessage } from '../api/axios.js';
import ImageGallery from '../components/ImageGallery.jsx';
import { formatPrice, propertyLabel } from '../components/ListingCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useFavorites } from '../context/FavoritesContext.jsx';

const statusLabel = { pending: 'Pending review', approved: 'Approved', rejected: 'Rejected' };

export default function ListingDetail() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const favorites = useFavorites();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [inquiryBusy, setInquiryBusy] = useState(false);
  const [inquiryNotice, setInquiryNotice] = useState('');
  const [inquiryError, setInquiryError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get(`/listings/${id}`)
      .then((res) => active && setListing(res.data.listing))
      .catch((err) => active && setError(errorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  if (authLoading) return <p className="muted center">Loading...</p>;

  if (loading) return <p className="muted center">Loading listing...</p>;

  if (error) {
    return (
      <div className="card center empty-state">
        <h2>Listing unavailable</h2>
        <p className="muted">{error}</p>
        <Link to="/listings" className="btn btn-primary">
          Back to listings
        </Link>
      </div>
    );
  }

  if (!listing) return <p className="muted center">Listing unavailable.</p>;

  // Visitors who are not signed in may only see the photos. The API enforces
  // this too, so the rest of the listing is not even sent to the browser.
  if (!user) {
    return (
      <article className="listing-detail">
        <ImageGallery images={listing.images} title="Property" />

        <div className="card guest-lock">
          <span className="guest-lock-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="10" width="16" height="10" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
          </span>
          <h1>Sign in to view this property</h1>
          <p className="muted">
            Photos are public. Sign in to see the price, location, description, amenities and the
            agent&apos;s contact details — or create an account in a few seconds.
          </p>
          <div className="guest-lock-actions">
            <Link
              to="/login"
              state={{ from: { pathname: `/listings/${listing._id}` } }}
              className="btn btn-primary btn-lg"
            >
              Sign in
            </Link>
            <Link to="/register" className="btn btn-lg">
              Create an account
            </Link>
          </div>
        </div>
      </article>
    );
  }

  const agent = listing.agent;
  const isOwner = user && (user.role === 'admin' || agent?._id === user.id);
  const saved = Boolean(user && favorites?.isFavorite(listing._id));

  const sendInquiry = async (e) => {
    e.preventDefault();
    setInquiryBusy(true);
    setInquiryError('');
    setInquiryNotice('');
    try {
      const { data } = await api.post('/inquiries', { listingId: listing._id, message });
      setInquiryNotice(data.message || 'Your inquiry was sent');
      setMessage('');
    } catch (err) {
      setInquiryError(errorMessage(err));
    } finally {
      setInquiryBusy(false);
    }
  };

  const startChat = async () => {
    setInquiryError('');
    try {
      const { data } = await api.post('/chat/conversations', { userId: agent._id });
      navigate(`/chat/${data.conversation.id}`);
    } catch (err) {
      setInquiryError(errorMessage(err));
    }
  };
  const address = listing.address || {};
  const addressLine = [address.street, address.city, address.state, address.zip].filter(Boolean).join(', ');

  const facts = [
    ['Type', propertyLabel[listing.propertyType] || listing.propertyType],
    ['Listing', listing.listingType === 'rent' ? 'For rent' : 'For sale'],
    ['Bedrooms', listing.bedrooms],
    ['Bathrooms', listing.bathrooms],
    ['Area', listing.area ? `${listing.area} sqft` : null],
  ].filter(([, value]) => value !== null && value !== undefined && value !== '' && value !== 0);

  return (
    <article className="listing-detail">
      <div className="detail-head">
        <div>
          <div className="detail-tags">
            <span className={`tag tag-${listing.listingType}`}>
              {listing.listingType === 'rent' ? 'For rent' : 'For sale'}
            </span>
            {isOwner && <span className="tag tag-status">{statusLabel[listing.status] || listing.status}</span>}
          </div>
          <h1>{listing.title}</h1>
          {addressLine && <p className="muted">{addressLine}</p>}
        </div>

        <div className="detail-head-side">
          <p className="detail-price">{formatPrice(listing)}</p>
          <div className="detail-head-actions">
            {user && (
              <button
                type="button"
                className={saved ? 'btn fav-toggle active' : 'btn fav-toggle'}
                onClick={() => favorites.toggle(listing._id)}
                aria-pressed={saved}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill={saved ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
                </svg>
                {saved ? 'Saved' : 'Save'}
              </button>
            )}
            {isOwner && (
              <Link to={`/agent/${listing._id}/edit`} className="btn">
                Edit listing
              </Link>
            )}
          </div>
        </div>
      </div>

      {isOwner && listing.status === 'pending' && (
        <p className="alert alert-info">This listing is awaiting admin review. It is only visible to you until approved.</p>
      )}
      {isOwner && listing.status === 'rejected' && (
        <p className="alert alert-error">
          This listing was rejected{listing.rejectionReason ? `: ${listing.rejectionReason}` : ''}. Edit and save it to
          send it back for review.
        </p>
      )}

      <ImageGallery images={listing.images} title={listing.title} />

      <div className="detail-columns">
        <div className="detail-main">
          <section className="card">
            <h2>Description</h2>
            <p className="detail-description">{listing.description}</p>
          </section>

          {facts.length > 0 && (
            <section className="card">
              <h2>Details</h2>
              <dl className="facts">
                {facts.map(([label, value]) => (
                  <div key={label} className="fact">
                    <dt className="muted small">{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {listing.amenities?.length > 0 && (
            <section className="card">
              <h2>Amenities</h2>
              <div className="chips">
                {listing.amenities.map((amenity) => (
                  <span className="chip" key={amenity}>
                    {amenity}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="detail-side">
          <section className="card agent-card">
            <h2>Listed by</h2>
            <p className="agent-name">{agent?.name || 'Agent'}</p>

            {agent?.phone && (
              <a className="btn btn-primary" href={`tel:${agent.phone}`}>
                Call {agent.phone}
              </a>
            )}
            {agent?.email && (
              <a className="btn" href={`mailto:${agent.email}`}>
                Email agent
              </a>
            )}
            {!isOwner && (
              <button type="button" className="btn" onClick={startChat}>
                Chat with agent
              </button>
            )}

            <p className="muted small">
              {listing.views} {listing.views === 1 ? 'view' : 'views'}
            </p>

            {user && !isOwner && (
              <form className="inquiry-form" onSubmit={sendInquiry}>
                <label>
                  Message the agent
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Hi, I'm interested in this property. Is it still available?"
                    maxLength={2000}
                  />
                </label>
                {inquiryNotice && <p className="alert alert-success">{inquiryNotice}</p>}
                {inquiryError && <p className="alert alert-error">{inquiryError}</p>}
                <button className="btn btn-primary" disabled={inquiryBusy || !message.trim()}>
                  {inquiryBusy ? 'Sending...' : 'Send inquiry'}
                </button>
              </form>
            )}
          </section>
        </aside>
      </div>
    </article>
  );
}
