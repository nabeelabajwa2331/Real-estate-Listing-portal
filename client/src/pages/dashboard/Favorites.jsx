import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../../api/axios.js';
import ListingCard from '../../components/ListingCard.jsx';
import { useFavorites } from '../../context/FavoritesContext.jsx';

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
    <div>
      <header className="page-head">
        <div>
          <h1>Favorites</h1>
          <p className="muted small">
            {visible.length} saved {visible.length === 1 ? 'property' : 'properties'}
          </p>
        </div>
      </header>

      {error && <p className="alert alert-error">{error}</p>}
      {loading ? (
        <p className="muted center">Loading favorites...</p>
      ) : visible.length === 0 ? (
        <div className="card center empty-state">
          <h2>No favorites yet</h2>
          <p className="muted">Tap the heart on any listing to save it here.</p>
          <Link to="/listings" className="btn btn-primary">
            Browse listings
          </Link>
        </div>
      ) : (
        <div className="search-list">
          {visible.map((listing) => (
            <ListingCard key={listing._id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
