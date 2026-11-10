import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errorMessage } from '../../api/axios.js';
import ListingCard from '../../components/ListingCard.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useFavorites } from '../../context/FavoritesContext.jsx';
import { useSavedSearches } from '../../context/SavedSearchesContext.jsx';
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
  user: (
    <svg {...iconProps}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>
  ),
  check: (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m4 12 5 5L20 6" />
    </svg>
  ),
};

export default function Overview() {
  const { user } = useAuth();
  const {
    items: favorites,
    count: favoriteCount,
    ids,
    loaded: favoritesLoaded,
    error: favoritesError,
    refresh: refreshFavorites,
  } = useFavorites();
  const {
    searches,
    count: searchCount,
    loaded: searchesLoaded,
    error: searchesError,
    refresh: refreshSearches,
  } = useSavedSearches();
  const navigate = useNavigate();

  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api
      .get('/listings', { params: { limit: 8, sort: 'newest' } })
      .then((res) => active && setRecommended(res.data.listings))
      .catch((err) => active && setError(errorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const firstName = user.name?.split(' ')[0] || user.name;
  const suggestions = recommended.filter((listing) => !ids.has(listing._id)).slice(0, 4);

  const runSearch = (search) => {
    const qs = searchQueryString(search.params);
    navigate(qs ? `/listings?${qs}` : '/listings');
  };

  return (
    <div className="dash-page">
      <header className="dash-page-head">
        <div>
          <p className="dash-eyebrow">Overview</p>
          <h1>Welcome back, {firstName}</h1>
          <p className="muted">Here’s what’s happening with your property search.</p>
        </div>
        <div className="dash-page-actions">
          <Link to="/listings" className="btn btn-primary">
            Browse listings
          </Link>
        </div>
      </header>

      <div className="dash-metrics">
        <Link to="/dashboard/saved" className="card dash-metric">
          <span className="dash-metric-icon">{icons.heart}</span>
          <span className="dash-metric-copy">
            <span className="dash-metric-value" aria-live="polite">
              {favoritesLoaded ? favoriteCount : '—'}
            </span>
            <span className="dash-metric-label">Saved items</span>
          </span>
        </Link>

        <Link to="/dashboard/searches" className="card dash-metric">
          <span className="dash-metric-icon">{icons.search}</span>
          <span className="dash-metric-copy">
            <span className="dash-metric-value" aria-live="polite">
              {searchesLoaded ? searchCount : '—'}
            </span>
            <span className="dash-metric-label">Saved searches</span>
          </span>
        </Link>

        <div className="card dash-metric">
          <span className="dash-metric-icon">
            {icons.user}
            {user.isVerified && <span className="dash-metric-check">{icons.check}</span>}
          </span>
          <span className="dash-metric-copy">
            <span className="dash-metric-value">{user.isVerified ? 'Verified' : 'Complete'}</span>
            <span className="dash-metric-label">Account status</span>
          </span>
        </div>
      </div>

      <div className="dash-content-grid">
        <section className="card dash-panel">
          <div className="dash-section-head">
            <div>
              <h2>Saved items</h2>
              <p className="muted small">Homes you’re keeping an eye on.</p>
            </div>
            {favorites.length > 0 && (
              <Link to="/dashboard/saved" className="dash-panel-link">
                View all
              </Link>
            )}
          </div>

          {favoritesError && (
            <div className="dash-inline-error">
              <p className="alert alert-error">{favoritesError}</p>
              <button type="button" className="btn btn-sm" onClick={refreshFavorites}>
                Try again
              </button>
            </div>
          )}

          {!favoritesLoaded ? (
            <p className="muted dash-loading">Loading saved items...</p>
          ) : favorites.length === 0 ? (
            !favoritesError && (
              <p className="muted small dash-inline-empty">
                Save a property from <Link to="/listings">Browse</Link> to keep it here for later.
              </p>
            )
          ) : (
            <div className="dash-card-grid">
              {favorites.slice(0, 4).map((listing) => (
                <ListingCard key={listing._id} listing={listing} />
              ))}
            </div>
          )}
        </section>

        <div className="dash-aside-stack">
          <section className="card dash-panel">
            <div className="dash-section-head">
              <div>
                <h2>Saved searches</h2>
                <p className="muted small">Re-run a search in one click.</p>
              </div>
              {searches.length > 0 && (
                <Link to="/dashboard/searches" className="dash-panel-link">
                  View all
                </Link>
              )}
            </div>

            {searchesError && (
              <div className="dash-inline-error">
                <p className="alert alert-error">{searchesError}</p>
                <button type="button" className="btn btn-sm" onClick={refreshSearches}>
                  Try again
                </button>
              </div>
            )}

            {!searchesLoaded ? (
              <p className="muted dash-loading">Loading saved searches...</p>
            ) : searches.length === 0 ? (
              !searchesError && (
                <p className="muted small dash-inline-empty">
                  Save a search on <Link to="/listings">Browse</Link> to re-run it later.
                </p>
              )
            ) : (
              <ul className="dash-search-list">
                {searches.slice(0, 3).map((search) => (
                  <li key={search._id} className="dash-search-item">
                    <div>
                      <p className="dash-search-title">{search.name}</p>
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
        </div>
      </div>

      <section className="card dash-panel">
        <div className="dash-section-head">
          <div>
            <h2>Recommended for you</h2>
            <p className="muted small">Fresh listings that match your interests.</p>
          </div>
          <Link to="/listings" className="dash-panel-link">
            Browse all
          </Link>
        </div>

        {error ? (
          <p className="alert alert-error">{error}</p>
        ) : loading ? (
          <p className="muted dash-loading">Loading recommendations...</p>
        ) : suggestions.length === 0 ? (
          <p className="muted small">No new recommendations right now — check back soon.</p>
        ) : (
          <div className="dash-card-grid">
            {suggestions.map((listing) => (
              <ListingCard key={listing._id} listing={listing} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
