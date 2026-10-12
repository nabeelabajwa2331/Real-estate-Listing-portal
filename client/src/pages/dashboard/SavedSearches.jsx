import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errorMessage } from '../../api/axios.js';
import { searchSummary, searchQueryString } from '../../utils/search.js';

export default function SavedSearches() {
  const navigate = useNavigate();
  const [searches, setSearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let active = true;
    api
      .get('/saved-searches')
      .then((res) => active && setSearches(res.data.searches))
      .catch((err) => active && setError(errorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const run = (search) => {
    const qs = searchQueryString(search.params);
    navigate(qs ? `/listings?${qs}` : '/listings');
  };

  const remove = async (search) => {
    if (!window.confirm(`Delete "${search.name}"?`)) return;
    setBusyId(search._id);
    setError('');
    try {
      await api.delete(`/saved-searches/${search._id}`);
      setSearches((list) => list.filter((item) => item._id !== search._id));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <header className="page-head">
        <div>
          <h1>Saved searches</h1>
          <p className="muted small">Re-run a search to see the latest matches.</p>
        </div>
        <Link to="/listings" className="btn">
          New search
        </Link>
      </header>

      {error && <p className="alert alert-error">{error}</p>}
      {loading ? (
        <p className="muted center">Loading saved searches...</p>
      ) : searches.length === 0 ? (
        <div className="card center empty-state">
          <h2>No saved searches</h2>
          <p className="muted">Use “Save search” on the browse page to keep one here.</p>
          <Link to="/listings" className="btn btn-primary">
            Browse listings
          </Link>
        </div>
      ) : (
        <ul className="saved-list">
          {searches.map((search) => (
            <li className="card saved-item" key={search._id}>
              <div className="saved-info">
                <p className="saved-name">{search.name}</p>
                <p className="muted small">{searchSummary(search.params)}</p>
                <p className="muted small">Saved {new Date(search.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="saved-actions">
                <button type="button" className="btn btn-sm btn-primary" onClick={() => run(search)}>
                  Run search
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  disabled={busyId === search._id}
                  onClick={() => remove(search)}
                >
                  {busyId === search._id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
