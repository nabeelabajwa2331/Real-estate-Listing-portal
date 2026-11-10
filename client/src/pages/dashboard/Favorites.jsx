import { Link } from 'react-router-dom';
import ListingCard from '../../components/ListingCard.jsx';
import { useFavorites } from '../../context/FavoritesContext.jsx';

const heartIcon = (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
  </svg>
);

// Saved items are read from the shared favorites store, so a listing saved or
// removed anywhere in the app appears here (and the counts) immediately.
export default function Favorites() {
  const { items, count, loaded, error, refresh } = useFavorites();

  return (
    <div className="dash-page">
      <header className="dash-page-head">
        <div>
          <p className="dash-eyebrow">Saved properties</p>
          <h1>Saved items</h1>
          <p className="muted small" aria-live="polite">
            {loaded
              ? `${count} saved ${count === 1 ? 'property' : 'properties'}`
              : 'Loading saved items...'}
          </p>
        </div>
        <div className="dash-page-actions">
          <Link to="/listings" className="btn">
            Browse listings
          </Link>
        </div>
      </header>

      {error && (
        <div className="dash-inline-error">
          <p className="alert alert-error">{error}</p>
          <button type="button" className="btn btn-sm" onClick={refresh}>
            Try again
          </button>
        </div>
      )}

      {!loaded ? (
        <p className="muted dash-loading">Loading saved items...</p>
      ) : items.length === 0 ? (
        !error && (
          <div className="card dash-empty-state">
            <span className="dash-empty-icon">{heartIcon}</span>
            <h2>No saved items yet</h2>
            <p className="muted">Tap the heart on any listing to save it here.</p>
            <Link to="/listings" className="btn btn-primary">
              Browse listings
            </Link>
          </div>
        )
      ) : (
        <div className="dash-card-grid">
          {items.map((listing) => (
            <ListingCard key={listing._id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
