import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../../api/axios.js';
import ListingCard from '../../components/ListingCard.jsx';
import { useFavorites } from '../../context/FavoritesContext.jsx';

const heartIcon = (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
  </svg>
);

export default function Favorites() {
  const { ids } = useFavorites();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api
      .get('/favorites')
      .then((res) => active && setListings(res.data.listings))
      .catch((err) => active && setError(errorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  // Reflect un-saving immediately by cross-checking the favorites context.
  const visible = listings.filter((listing) => ids.has(listing._id));

  return (
    <div className="dash-page">
      <header className="dash-page-head">
        <div>
          <p className="dash-eyebrow">Saved properties</p>
          <h1>Saved items</h1>
          <p className="muted small" aria-live="polite">
            {visible.length} saved {visible.length === 1 ? 'property' : 'properties'}
          </p>
        </div>
        <div className="dash-page-actions">
          <Link to="/listings" className="btn">
            Browse listings
          </Link>
        </div>
      </header>

      {error && <p className="alert alert-error">{error}</p>}

      {loading ? (
        <p className="muted dash-loading">Loading saved items...</p>
      ) : visible.length === 0 ? (
        !error && (
          <div className="card dash-empty-state">
            <span className="dash-empty-icon">{heartIcon}</span>
            <h2>No saved items yet</h2>
            <p className="muted">Tap the heart on any listing to save it here.</p>
          </div>
        )
      ) : (
        <div className="dash-card-grid">
          {visible.map((listing) => (
            <ListingCard key={listing._id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
