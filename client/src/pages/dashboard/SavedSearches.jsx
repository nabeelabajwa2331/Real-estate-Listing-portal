import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSavedSearches } from '../../context/SavedSearchesContext.jsx';
import { searchSummary, searchQueryString } from '../../utils/search.js';

const searchIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export default function SavedSearches() {
  const navigate = useNavigate();
  const { searches, count, loaded, error, remove, refresh } = useSavedSearches();
  const [busyId, setBusyId] = useState(null);

  const run = (search) => {
    const qs = searchQueryString(search.params);
    navigate(qs ? `/listings?${qs}` : '/listings');
  };

  const onRemove = async (search) => {
    if (!window.confirm(`Delete "${search.name}"?`)) return;
    setBusyId(search._id);
    await remove(search._id);
    setBusyId(null);
  };

  return (
    <div className="dash-page">
      <header className="dash-page-head">
        <div>
          <p className="dash-eyebrow">Search library</p>
          <h1>Saved searches</h1>
          <p className="muted small" aria-live="polite">
            {loaded ? `${count} saved ${count === 1 ? 'search' : 'searches'}` : 'Loading saved searches...'}
          </p>
        </div>
        <div className="dash-page-actions">
          <Link to="/listings" className="btn btn-primary">
            New search
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
        <p className="muted dash-loading">Loading saved searches...</p>
      ) : searches.length === 0 ? (
        !error && (
          <div className="card dash-empty-state">
            <span className="dash-empty-icon">{searchIcon}</span>
            <h2>No saved searches</h2>
            <p className="muted">Use “Save search” on the browse page to keep one here.</p>
            <Link to="/listings" className="btn btn-primary">
              Start a search
            </Link>
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
                  onClick={() => onRemove(search)}
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
