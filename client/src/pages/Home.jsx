import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios.js';
import { useAuth, homeForRole } from '../context/AuthContext.jsx';

const features = [
  {
    title: 'Every listing reviewed',
    text: 'Our team checks each property before it goes live, so the listings you browse are genuine and current.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2l7 4v6c0 5-3 8-7 10-4-2-7-5-7-10V6z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: 'Search that fits real life',
    text: 'Filter by city, budget, property type and size, then compare matches on an interactive map.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
    ),
  },
  {
    title: 'Talk to the right agent',
    text: 'Message listing agents directly and keep every inquiry and reply in one organised inbox.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.9-.9L3 21l1.9-4.6A8.4 8.4 0 0 1 4 11.5a8.4 8.4 0 0 1 8.5-8.4 8.5 8.5 0 0 1 8.5 8.4z" />
      </svg>
    ),
  },
];

const cities = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar'];

const propertyTypes = [
  ['house', 'House'],
  ['apartment', 'Apartment'],
  ['plot', 'Plot'],
  ['commercial', 'Commercial'],
  ['room', 'Room'],
];

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState({ city: '', listingType: '', propertyType: '' });

  useEffect(() => {
    let active = true;
    api
      .get('/stats')
      .then((res) => active && setStats(res.data))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const format = (value) => (stats ? new Intl.NumberFormat('en-US').format(value) : '—');

  const onSearch = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    Object.entries(search).forEach(([key, value]) => {
      if (value.trim()) params.set(key, value.trim());
    });
    const query = params.toString();
    navigate(query ? `/listings?${query}` : '/listings');
  };

  const browseCity = (city) => {
    navigate(`/listings?city=${encodeURIComponent(city)}`);
  };

  return (
    <section className="home-page">
      <div className="home-hero">
        <div className="home-hero-copy">
          <p className="home-badge">
            <span className="home-badge-dot" aria-hidden="true" />
            Pakistan&apos;s reviewed property marketplace
          </p>
          <h1>Find a home you can move into with confidence.</h1>
          <p className="home-lede">
            Browse verified homes, plots and rentals from local agents. Compare on the map, save
            your shortlist and speak to the agent directly.
          </p>

          <form className="home-search" onSubmit={onSearch} role="search" aria-label="Property search">
            <label className="home-search-field">
              <span>Location</span>
              <input
                type="text"
                name="city"
                value={search.city}
                onChange={(event) => setSearch({ ...search, city: event.target.value })}
                placeholder="City or area"
                autoComplete="address-level2"
              />
            </label>
            <label className="home-search-field">
              <span>Purpose</span>
              <select
                name="listingType"
                value={search.listingType}
                onChange={(event) => setSearch({ ...search, listingType: event.target.value })}
              >
                <option value="">Buy or rent</option>
                <option value="sale">For sale</option>
                <option value="rent">For rent</option>
              </select>
            </label>
            <label className="home-search-field">
              <span>Property</span>
              <select
                name="propertyType"
                value={search.propertyType}
                onChange={(event) => setSearch({ ...search, propertyType: event.target.value })}
              >
                <option value="">Any type</option>
                {propertyTypes.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="btn btn-primary home-search-submit">
              Search properties
            </button>
          </form>

          {!user && (
            <p className="home-search-note">
              Already a member? <Link to="/login">Sign in</Link> to see your saved homes and
              conversations.
            </p>
          )}
        </div>

        <div className="home-hero-media">
          <img
            src="/img/listings/hero-home.jpg"
            alt="A modern home with large windows and a garden"
            width="1400"
            height="933"
          />
          <div className="home-media-card">
            <span className="home-media-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l7 4v6c0 5-3 8-7 10-4-2-7-5-7-10V6z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </span>
            <span>
              <strong>Verified listings</strong>
              <small>Reviewed before they go live</small>
            </span>
          </div>
        </div>
      </div>

      <div className="home-stats" aria-label="Marketplace overview">
        <div className="stat">
          <b>{format(stats?.listings ?? 0)}</b>
          <span>Live listings</span>
        </div>
        <div className="stat">
          <b>{format(stats?.agents ?? 0)}</b>
          <span>Verified agents</span>
        </div>
        <div className="stat">
          <b>{format(stats?.cities ?? 0)}</b>
          <span>Cities covered</span>
        </div>
      </div>

      <section className="home-cities" aria-labelledby="home-cities-title">
        <div className="home-section-head home-cities-head">
          <div>
            <p className="hero-kicker">Start locally</p>
            <h2 id="home-cities-title">Explore property by city</h2>
          </div>
          <Link to="/listings" className="home-section-link">
            All listings
            <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="home-city-grid">
          {cities.map((city) => (
            <button key={city} type="button" className="home-city" onClick={() => browseCity(city)}>
              <span>{city}</span>
              <span className="home-city-arrow" aria-hidden="true">
                →
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="home-features" aria-labelledby="home-features-title">
        <div className="home-section-head">
          <p className="hero-kicker">Why RealEstate</p>
          <h2 id="home-features-title">A calmer way to search, compare and move.</h2>
        </div>

        <div className="feature-grid">
          {features.map((feature) => (
            <article className="feature" key={feature.title}>
              <span className="feature-icon">{feature.icon}</span>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-cta" aria-labelledby="home-cta-title">
        <div>
          <p className="hero-kicker">Ready when you are</p>
          <h2 id="home-cta-title">Your shortlist, searches and conversations in one place.</h2>
          <p className="home-cta-text">
            Create a free account to save properties, keep searches and message agents without
            losing track of the conversation.
          </p>
        </div>
        <div className="home-cta-actions">
          {user ? (
            <Link to={homeForRole(user.role)} className="btn btn-primary btn-lg">
              Open dashboard
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary btn-lg">
                Create a free account
              </Link>
              <Link to="/login" className="btn btn-lg">
                Sign in
              </Link>
            </>
          )}
        </div>
      </section>
    </section>
  );
}
