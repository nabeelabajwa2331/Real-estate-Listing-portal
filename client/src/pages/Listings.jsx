import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api, { errorMessage } from '../api/axios.js';
import ListingCard from '../components/ListingCard.jsx';
import ListingMap from '../components/ListingMap.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const emptyFilters = {
  city: '',
  listingType: '',
  propertyType: '',
  minPrice: '',
  maxPrice: '',
  minArea: '',
  maxArea: '',
  bedrooms: '',
};

const FILTER_KEYS = Object.keys(emptyFilters);
const BOUND_KEYS = ['north', 'south', 'east', 'west'];

const sortOptions = [
  ['newest', 'Newest first'],
  ['price-asc', 'Price: low to high'],
  ['price-desc', 'Price: high to low'],
  ['area-desc', 'Area: largest first'],
  ['area-asc', 'Area: smallest first'],
];

const sameBounds = (a, b) =>
  a &&
  Math.abs(a.north - b.north) < 0.0002 &&
  Math.abs(a.south - b.south) < 0.0002 &&
  Math.abs(a.east - b.east) < 0.0002 &&
  Math.abs(a.west - b.west) < 0.0002;

const sameFilterValues = (a, b) => FILTER_KEYS.every((key) => (a[key] || '') === (b[key] || ''));
const sameBoundsValue = (a, b) => {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return Boolean(sameBounds(a, b));
};

// Reads the initial state from the URL so a saved search can be replayed.
function readInitialState(searchParams) {
  const filters = { ...emptyFilters };
  for (const key of FILTER_KEYS) filters[key] = searchParams.get(key) || '';

  let bounds = null;
  if (BOUND_KEYS.every((key) => searchParams.get(key) !== null)) {
    bounds = Object.fromEntries(BOUND_KEYS.map((key) => [key, Number(searchParams.get(key))]));
  }

  return {
    filters,
    sort: searchParams.get('sort') || 'newest',
    page: Math.max(1, Number(searchParams.get('page')) || 1),
    bounds,
  };
}

const LIMIT = 8;

export default function Listings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initial = useRef(readInitialState(searchParams)).current;

  const [form, setForm] = useState(initial.filters);
  const [filters, setFilters] = useState(initial.filters); // applied filters
  const [sort, setSort] = useState(initial.sort);
  const [page, setPage] = useState(initial.page);
  const [bounds, setBounds] = useState(initial.bounds);
  const [autoSearch, setAutoSearch] = useState(true);
  const [showMore, setShowMore] = useState(
    Boolean(initial.filters.minArea || initial.filters.maxArea || initial.filters.bedrooms)
  );

  const [listings, setListings] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [fitKey, setFitKey] = useState(0);

  const shouldFit = useRef(true);
  const autoSearchRef = useRef(autoSearch);
  autoSearchRef.current = autoSearch;
  const boundsTimer = useRef();

  // Params actually sent to the API (includes paging + viewport bounds).
  const requestParams = useMemo(() => {
    const p = { ...filters, sort, page, limit: LIMIT };
    if (autoSearch && bounds) Object.assign(p, bounds);
    return p;
  }, [filters, sort, page, bounds, autoSearch]);

  // Params stored in a saved search (no paging; keeps the filters + area).
  const savedParams = useMemo(() => {
    const p = {};
    for (const key of FILTER_KEYS) if (filters[key]) p[key] = filters[key];
    if (sort !== 'newest') p.sort = sort;
    if (autoSearch && bounds) Object.assign(p, bounds);
    return p;
  }, [filters, sort, bounds, autoSearch]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api
      .get('/listings', { params: requestParams })
      .then((res) => {
        if (!active) return;
        setListings(res.data.listings);
        setMeta({ page: res.data.page, pages: res.data.pages, total: res.data.total });
        if (shouldFit.current) {
          shouldFit.current = false;
          setFitKey((k) => k + 1);
        }
      })
      .catch((err) => active && setError(errorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [requestParams]);

  // Adopt filters from the URL when it changes from the outside (browser
  // back/forward, a shared link, or a replayed saved search). Guarded so our own
  // URL sync below does not cause a loop.
  useEffect(() => {
    const next = readInitialState(searchParams);
    setFilters((current) => (sameFilterValues(current, next.filters) ? current : next.filters));
    setForm((current) => (sameFilterValues(current, next.filters) ? current : next.filters));
    setSort((current) => (current === next.sort ? current : next.sort));
    setPage((current) => (current === next.page ? current : next.page));
    setBounds((current) => (sameBoundsValue(current, next.bounds) ? current : next.bounds));
  }, [searchParams]);

  // Keep the URL in step with the current search so it is shareable.
  useEffect(() => {
    const next = new URLSearchParams();
    for (const key of FILTER_KEYS) if (filters[key]) next.set(key, filters[key]);
    if (sort !== 'newest') next.set('sort', sort);
    if (page > 1) next.set('page', String(page));
    if (autoSearch && bounds) for (const key of BOUND_KEYS) next.set(key, Number(bounds[key]).toFixed(6));
    setSearchParams(next, { replace: true });
  }, [filters, sort, page, bounds, autoSearch, setSearchParams]);

  const onBoundsChange = useCallback((next) => {
    if (!autoSearchRef.current) return;
    clearTimeout(boundsTimer.current);
    boundsTimer.current = setTimeout(() => {
      setBounds((prev) => (sameBounds(prev, next) ? prev : next));
    }, 350);
  }, []);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = (e) => {
    e.preventDefault();
    shouldFit.current = true;
    setFilters(form);
    setPage(1);
  };

  const onSort = (e) => {
    shouldFit.current = true;
    setSort(e.target.value);
    setPage(1);
  };

  const toggleAutoSearch = (e) => {
    const value = e.target.checked;
    setAutoSearch(value);
    if (!value) setBounds(null);
  };

  const resetFilters = () => {
    setForm(emptyFilters);
    setFilters(emptyFilters);
    setSort('newest');
    setPage(1);
    setShowMore(false);
  };

  const goToPage = (next) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveSearch = async () => {
    setError('');
    setNotice('');
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/listings' } } });
      return;
    }

    const suggested =
      [filters.city, filters.propertyType].filter(Boolean).join(' ') ||
      (filters.listingType === 'rent' ? 'Rentals' : filters.listingType === 'sale' ? 'For sale' : 'All listings');
    const name = window.prompt('Name this search', suggested);
    if (!name) return;

    try {
      await api.post('/saved-searches', { name, params: savedParams });
      setNotice(`Saved "${name.trim()}" to your dashboard.`);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <section className="listings-page">
      <header className="page-head">
        <div>
          <h1>Find your next property</h1>
          <p className="muted small">
            {meta.total} {meta.total === 1 ? 'listing' : 'listings'} match your search
          </p>
        </div>
      </header>

      <form className="filters card" onSubmit={onSubmit}>
        <label className="filter-field filter-city">
          City
          <input name="city" value={form.city} onChange={onChange} placeholder="Any city" />
        </label>
        <label className="filter-field filter-type">
          Listing type
          <select name="listingType" value={form.listingType} onChange={onChange}>
            <option value="">Any</option>
            <option value="sale">For sale</option>
            <option value="rent">For rent</option>
          </select>
        </label>
        <label className="filter-field filter-property">
          Property type
          <select name="propertyType" value={form.propertyType} onChange={onChange}>
            <option value="">Any</option>
            <option value="house">House</option>
            <option value="apartment">Apartment</option>
            <option value="plot">Plot</option>
            <option value="commercial">Commercial</option>
            <option value="room">Room</option>
          </select>
        </label>
        <label className="filter-field filter-price">
          Min price
          <input type="number" name="minPrice" value={form.minPrice} onChange={onChange} min="0" placeholder="0" />
        </label>
        <label className="filter-field filter-price">
          Max price
          <input type="number" name="maxPrice" value={form.maxPrice} onChange={onChange} min="0" placeholder="Any" />
        </label>

        <div className="filter-actions">
          <button className="btn btn-primary">Search</button>
          <button type="button" className="btn btn-ghost" onClick={resetFilters}>
            Clear
          </button>
          <button
            type="button"
            className="btn btn-ghost filter-toggle"
            onClick={() => setShowMore((open) => !open)}
            aria-expanded={showMore}
          >
            {showMore ? 'Fewer filters' : 'More filters'}
          </button>
        </div>

        {showMore && (
          <>
            <label className="filter-field filter-area">
              Min area (sqft)
              <input type="number" name="minArea" value={form.minArea} onChange={onChange} min="0" placeholder="0" />
            </label>
            <label className="filter-field filter-area">
              Max area (sqft)
              <input type="number" name="maxArea" value={form.maxArea} onChange={onChange} min="0" placeholder="Any" />
            </label>
            <label className="filter-field filter-bedrooms">
              Bedrooms (min)
              <input type="number" name="bedrooms" value={form.bedrooms} onChange={onChange} min="0" placeholder="Any" />
            </label>
          </>
        )}
      </form>

      <div className="search-toolbar">
        <span className="muted small">
          {meta.total} {meta.total === 1 ? 'result' : 'results'}
        </span>
        <div className="toolbar-actions">
          <button type="button" className="btn btn-sm save-search-btn" onClick={saveSearch}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z" />
            </svg>
            Save search
          </button>
          <label className="sort-select">
            Sort
            <select value={sort} onChange={onSort}>
              {sortOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {notice && <p className="alert alert-success">{notice}</p>}

      <div className="search-layout" aria-busy={loading}>
        <div className="search-results">
          {error && <p className="alert alert-error">{error}</p>}
          {loading && listings.length === 0 && <p className="muted center">Loading listings...</p>}

          {!loading && !error && listings.length === 0 && (
            <div className="card center empty-state">
              <h2>No listings found</h2>
              <p className="muted">Try clearing filters or moving the map.</p>
            </div>
          )}

          {!error && listings.length > 0 && (
            <>
              <div className="search-list">
                {listings.map((listing) => (
                  <ListingCard key={listing._id} listing={listing} />
                ))}
              </div>

              {meta.pages > 1 && (
                <div className="pagination">
                  <button className="btn" disabled={meta.page <= 1} onClick={() => goToPage(meta.page - 1)}>
                    Previous
                  </button>
                  <span className="muted small">
                    Page {meta.page} of {meta.pages}
                  </span>
                  <button className="btn" disabled={meta.page >= meta.pages} onClick={() => goToPage(meta.page + 1)}>
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="search-map">
          <div className="map-head">
            <span className="muted small">Map</span>
            <label className="checkbox">
              <input type="checkbox" checked={autoSearch} onChange={toggleAutoSearch} />
              Search as I move the map
            </label>
          </div>
          <ListingMap listings={listings} onBoundsChange={onBoundsChange} fitKey={fitKey} />
        </div>
      </div>
    </section>
  );
}
