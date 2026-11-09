import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';

const features = [
  {
    title: 'Verified listings',
    text: 'Every property is reviewed before it goes live, so what you see is real.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l7 4v6c0 5-3 8-7 10-4-2-7-5-7-10V6z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: 'Search & map view',
    text: 'Filter by price, area and features, then explore matches on an interactive map.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    ),
  },
  {
    title: 'Contact agents directly',
    text: 'Message listing agents in one place and track every inquiry you send.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.9-.9L3 21l1.9-4.6A8.4 8.4 0 0 1 4 11.5a8.4 8.4 0 0 1 8.5-8.4 8.5 8.5 0 0 1 8.5 8.4z" />
      </svg>
    ),
  },
];

export default function Home() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

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

  return (
    <section className="home-page">
      <div className="home-hero">
        <div className="home-hero-copy">
          <p className="hero-kicker">Pakistan&apos;s property portal</p>
          <h1>Find a home you can move into with confidence.</h1>
          <p className="home-lede">
            Verified listings from agents, with search, map view, favorites and direct contact —
            without the noise.
          </p>

          {user ? (
            <div className="hero-actions">
              <Link to="/listings" className="btn btn-primary btn-lg">
                Browse listings
              </Link>
            </div>
          ) : (
            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary btn-lg">
                Create a free account
              </Link>
              <Link to="/login" className="btn btn-lg">
                Sign in
              </Link>
            </div>
          )}

          {!user && (
            <p className="hero-note muted small">
              Listings are available to signed-in members. Create a free account to browse, save
              favorites, contact agents and chat.
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

      <section className="home-features">
        <div className="home-section-head">
          <p className="hero-kicker">Why RealEstate</p>
          <h2>A calmer way to search, compare and move.</h2>
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
    </section>
  );
}
