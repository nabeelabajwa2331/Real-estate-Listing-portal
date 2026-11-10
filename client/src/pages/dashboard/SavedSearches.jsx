import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errorMessage } from '../../api/axios.js';
import { searchSummary, searchQueryString } from '../../utils/search.js';

const searchIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

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
    <div className="dash-page">
      <header className="dash-page-head">
        <div>
          <p className="dash-eyebrow">Search library</p>
          <h1>Saved searches</h1>
          <p className="muted small">Re-run a search to see the latest matches.</p>
        </div>
        <div className="dash-page-actions">
          <Link to="/listings" className="btn btn-primary">
            New search
          </Link>
        </div>
      </header>

      {error && <p className="alert alert-error">{error}</p>}

      {loading ? (
        <p className="muted dash-loading">Loading saved searches...</p>
      ) : searches.length === 0 ? (
        !error && (
          <div className="card dash-empty-state">
            <span className="dash-empty-icon">{searchIcon}</span>
            <h2>No saved searches</h2>
            <p className="muted">Use “Save search” on the browse page to keep one here.</p>
          </div>
        )
      ) : (
        <ul className="dash-saved-list">
          {searches.map((search) => (
            <li className="card dash-saved-item" key={search._id}>
              <div className="dash-saved-main">
                <span className="dash-saved-icon">{searchIcon}</span>
                <div>
                  <p className="dash-saved-name">{search.name}</p>
                  <p className="muted small dash-saved-meta">{searchSummary(search.params)}</p>
                  <p className="dash-saved-date">Saved {new Date(search.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="dash-saved-actions">
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
