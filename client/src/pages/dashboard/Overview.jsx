import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios.js';
import ListingCard from '../../components/ListingCard.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useFavorites } from '../../context/FavoritesContext.jsx';
import { useInquiries } from '../../context/InquiryContext.jsx';
import { useChat } from '../../context/ChatContext.jsx';
import { searchSummary, searchQueryString } from '../../utils/search.js';

const iconProps = {
  width: 21,
  height: 21,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

const icons = {
  heart: (
    <svg {...iconProps}>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  ),
  search: (
    <svg {...iconProps}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  ),
  chat: (
    <svg {...iconProps}>
      <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.9-.9L3 21l1.9-4.6A8.4 8.4 0 0 1 4 11.5a8.4 8.4 0 0 1 8.5-8.4 8.5 8.5 0 0 1 8.5 8.4z" />
    </svg>
  ),
  user: (
    <svg {...iconProps}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>
  ),
};

export default function Overview() {
  const { user } = useAuth();
  const { ids } = useFavorites();
  const { unread: inquiryUnread } = useInquiries();
  const { unread: chatUnread } = useChat();
  const navigate = useNavigate();

  const [favorites, setFavorites] = useState([]);
  const [searches, setSearches] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get('/favorites'),
      api.get('/saved-searches'),
      api.get('/listings', { params: { limit: 8, sort: 'newest' } }),
    ])
      .then(([favRes, searchRes, latestRes]) => {
        if (!active) return;
        setFavorites(favRes.data.listings);
        setSearches(searchRes.data.searches);
        setRecommended(latestRes.data.listings);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const messagesUnread = inquiryUnread + chatUnread;
  const firstName = user.name?.split(' ')[0] || user.name;
  const suggestions = recommended.filter((listing) => !ids.has(listing._id)).slice(0, 4);

  const runSearch = (search) => {
    const qs = searchQueryString(search.params);
    navigate(qs ? `/listings?${qs}` : '/listings');
  };

  return (
    <div className="dash-overview">
      <header className="dash-hero card">
        <div>
          <span className="eyebrow">Your dashboard</span>
          <h1>Welcome back, {firstName}</h1>
          <p className="muted">Here’s what’s happening with your property search.</p>
        </div>
        <div className="dash-hero-actions">
          <Link to="/listings" className="btn btn-primary">
            Browse listings
          </Link>
          <Link to="/messages" className="btn">
            Messages
          </Link>
        </div>
      </header>

      <div className="dash-stats">
        <Link to="/dashboard/favorites" className="dash-stat card">
          <span className="dash-stat-icon">{icons.heart}</span>
          <div>
            <b>{favorites.length}</b>
            <span className="muted small">Saved properties</span>
          </div>
        </Link>
        <Link to="/dashboard/searches" className="dash-stat card">
          <span className="dash-stat-icon">{icons.search}</span>
          <div>
            <b>{searches.length}</b>
            <span className="muted small">Saved searches</span>
          </div>
        </Link>
        <Link to="/messages" className="dash-stat card">
          <span className="dash-stat-icon">{icons.chat}</span>
          <div>
            <b>{messagesUnread}</b>
            <span className="muted small">Unread messages</span>
          </div>
        </Link>
        <Link to="/profile" className="dash-stat card">
          <span className="dash-stat-icon">{icons.user}</span>
          <div>
            <b>{user.isVerified ? 'Verified' : 'Complete'}</b>
            <span className="muted small">Account status</span>
          </div>
        </Link>
      </div>

      <div className="dash-grid">
        <section className="card dash-panel">
          <div className="dash-panel-head">
            <div>
              <h2>Recent favorites</h2>
              <p className="muted small">Homes you’re keeping an eye on.</p>
            </div>
            {favorites.length > 0 && <Link to="/dashboard/favorites">View all</Link>}
          </div>

          {loading ? (
            <p className="muted">Loading...</p>
          ) : favorites.length === 0 ? (
            <div className="dash-empty">
              <p className="muted">You have not saved any properties yet.</p>
              <Link to="/listings" className="btn btn-primary btn-sm">
                Find a property
              </Link>
            </div>
          ) : (
            <div className="listing-grid dash-listing-grid">
              {favorites.slice(0, 4).map((listing) => (
                <ListingCard key={listing._id} listing={listing} />
              ))}
            </div>
          )}
        </section>

        <div className="dash-side-stack">
          <section className="card dash-panel">
            <div className="dash-panel-head">
              <h2>Saved searches</h2>
              {searches.length > 0 && <Link to="/dashboard/searches">View all</Link>}
            </div>

            {searches.length === 0 ? (
              <p className="muted small">Save a search on the browse page to re-run it later.</p>
            ) : (
              <ul className="dash-mini-list">
                {searches.slice(0, 3).map((search) => (
                  <li key={search._id} className="dash-mini-item">
                    <div>
                      <p className="dash-mini-title">{search.name}</p>
                      <p className="muted small">{searchSummary(search.params)}</p>
                    </div>
                    <button type="button" className="btn btn-sm" onClick={() => runSearch(search)}>
                      Run
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card dash-panel dash-inbox-panel">
            <div className="dash-panel-head">
              <h2>Inbox</h2>
              <Link to="/messages">Open</Link>
            </div>
            <div className="dash-inbox-summary">
              <b>{messagesUnread}</b>
              <span className="muted small">unread {messagesUnread === 1 ? 'message' : 'messages'}</span>
            </div>
            <p className="muted small">Inquiries and direct chats are now in one WhatsApp-style inbox.</p>
            <Link to="/messages" className="btn btn-sm btn-primary">
              Go to messages
            </Link>
          </section>
        </div>
      </div>

      <section className="card dash-panel">
        <div className="dash-panel-head">
          <div>
            <h2>Recommended for you</h2>
            <p className="muted small">Fresh listings that match your interests.</p>
          </div>
          <Link to="/listings">See all</Link>
        </div>

        {suggestions.length === 0 ? (
          <p className="muted small">No new recommendations right now — check back soon.</p>
        ) : (
          <div className="listing-grid dash-listing-grid">
            {suggestions.map((listing) => (
              <ListingCard key={listing._id} listing={listing} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
