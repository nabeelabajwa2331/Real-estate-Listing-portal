import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios.js';
import { useAuth, homeForRole } from '../context/AuthContext.jsx';
import { useFavorites } from '../context/FavoritesContext.jsx';
import { useInquiries } from '../context/InquiryContext.jsx';
import { useChat } from '../context/ChatContext.jsx';

const roleLabel = { admin: 'Administrator', agent: 'Agent', user: 'Buyer / renter' };

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
  const { count: favoritesCount } = useFavorites();
  const { unread: inboxUnread } = useInquiries();
  const { unread: chatUnread } = useChat();
  const [stats, setStats] = useState(null);
  const [searchCount, setSearchCount] = useState(0);

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

  // Personal numbers come from the signed-in user's own data.
  useEffect(() => {
    if (!user) {
      setSearchCount(0);
      return undefined;
    }
    let active = true;
    api
      .get('/saved-searches')
      .then((res) => active && setSearchCount(res.data.searches.length))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user]);

  const format = (value) => (stats ? new Intl.NumberFormat('en-US').format(value) : '—');

  return (
    <section className="hero">
      <span className="eyebrow">Trusted real-estate platform</span>

      <h1>Find your next home in one place</h1>
      <p className="hero-sub">
        Verified listings from agents, with search, map view, favorites and direct contact.
      </p>

      {user ? (
        <div className="hero-actions">
          <Link to={homeForRole(user.role)} className="btn btn-primary btn-lg">
            Go to your area
          </Link>
          <Link to="/listings" className="btn btn-lg">
            Browse listings
          </Link>
        </div>
      ) : (
        <div className="hero-actions">
          <Link to="/listings" className="btn btn-primary btn-lg">
            Browse listings
          </Link>
          <Link to="/register" className="btn btn-lg">
            Create an account
          </Link>
        </div>
      )}

      {!user && (
        <p className="hero-note muted small">
          Browsing is open to everyone. <Link to="/login">Sign in</Link> to view full property
          details, save favorites, contact agents and chat.
        </p>
      )}

      {user && (
        <div className="home-account card">
          <div>
            <p className="home-account-hello">Welcome back, {user.name}</p>
            <p className="muted small">
              Signed in as {roleLabel[user.role] || 'Member'}. These numbers are yours.
            </p>
          </div>
          <div className="home-account-links">
            <Link to="/dashboard/favorites" className="home-account-chip">
              <b>{favoritesCount}</b> saved {favoritesCount === 1 ? 'property' : 'properties'}
            </Link>
            <Link to="/dashboard/searches" className="home-account-chip">
              <b>{searchCount}</b> saved {searchCount === 1 ? 'search' : 'searches'}
            </Link>
            <Link to="/inbox" className="home-account-chip">
              <b>{inboxUnread}</b> unread {inboxUnread === 1 ? 'inquiry' : 'inquiries'}
            </Link>
            <Link to="/chat" className="home-account-chip">
              <b>{chatUnread}</b> unread {chatUnread === 1 ? 'chat' : 'chats'}
            </Link>
          </div>
        </div>
      )}

      <div className="stats">
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

      <div className="feature-grid">
        {features.map((f) => (
          <article className="feature" key={f.title}>
            <span className="feature-icon">{f.icon}</span>
            <h3>{f.title}</h3>
            <p>{f.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
