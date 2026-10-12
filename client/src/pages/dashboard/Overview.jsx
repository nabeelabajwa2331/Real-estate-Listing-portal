import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios.js';
import ListingCard from '../../components/ListingCard.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Overview() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [searches, setSearches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([api.get('/favorites'), api.get('/saved-searches')])
      .then(([favRes, searchRes]) => {
        if (!active) return;
        setFavorites(favRes.data.listings);
        setSearches(searchRes.data.searches);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <header className="page-head">
        <div>
          <h1>Overview</h1>
          <p className="muted small">Welcome back, {user.name}.</p>
        </div>
      </header>

      <div className="stat-cards">
        <Link to="/dashboard/favorites" className="stat-card card">
          <span className="stat-card-value">{favorites.length}</span>
          <span className="muted small">Saved properties</span>
        </Link>
        <Link to="/dashboard/searches" className="stat-card card">
          <span className="stat-card-value">{searches.length}</span>
          <span className="muted small">Saved searches</span>
        </Link>
        <Link to="/listings" className="stat-card card">
          <span className="stat-card-value">Browse</span>
          <span className="muted small">Find new properties</span>
        </Link>
      </div>

      <section className="dash-section">
        <div className="page-head">
          <h2>Recent favorites</h2>
          {favorites.length > 0 && <Link to="/dashboard/favorites">View all</Link>}
        </div>

        {loading ? (
          <p className="muted">Loading...</p>
        ) : favorites.length === 0 ? (
          <div className="card center empty-state">
            <p className="muted">You have not saved any properties yet.</p>
            <Link to="/listings" className="btn btn-primary">
              Browse listings
            </Link>
          </div>
        ) : (
          <div className="search-list">
            {favorites.slice(0, 4).map((listing) => (
              <ListingCard key={listing._id} listing={listing} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
