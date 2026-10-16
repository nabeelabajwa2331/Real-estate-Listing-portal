import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api/axios.js';
import Avatar from '../components/Avatar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useInquiries } from '../context/InquiryContext.jsx';
import { assetUrl } from '../config/api.js';

const timeAgo = (value) => {
  if (!value) return '';
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString();
};

export default function Inbox() {
  const { user } = useAuth();
  const { tick } = useInquiries();
  const [box, setBox] = useState(user.role === 'agent' ? 'received' : 'sent');
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api
      .get('/inquiries', { params: { box } })
      .then((res) => active && setInquiries(res.data.inquiries))
      .catch((err) => active && setError(errorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [box, tick]);

  const isAgentView = box === 'received';

  return (
    <section className="inbox">
      <header className="page-head">
        <div>
          <h1>Inquiries</h1>
          <p className="muted small">
            {isAgentView ? 'Messages from people interested in your listings.' : 'Your conversations with agents.'}
          </p>
        </div>
      </header>

      <div className="tabs" role="tablist">
        <button
          role="tab"
          aria-selected={box === 'received'}
          className={box === 'received' ? 'tab active' : 'tab'}
          onClick={() => setBox('received')}
        >
          Received
        </button>
        <button
          role="tab"
          aria-selected={box === 'sent'}
          className={box === 'sent' ? 'tab active' : 'tab'}
          onClick={() => setBox('sent')}
        >
          Sent
        </button>
      </div>

      {error && <p className="alert alert-error">{error}</p>}
      {loading ? (
        <p className="muted center">Loading inquiries...</p>
      ) : inquiries.length === 0 ? (
        <div className="card center empty-state">
          <h2>No inquiries here</h2>
          <p className="muted">
            {isAgentView ? 'When someone contacts you, the conversation appears here.' : 'Open a listing and contact its agent.'}
          </p>
          <Link to="/listings" className="btn btn-primary">
            Browse listings
          </Link>
        </div>
      ) : (
        <ul className="thread-list">
          {inquiries.map((inquiry) => {
            const unread = isAgentView ? inquiry.agentUnread : inquiry.userUnread;
            const other = isAgentView ? inquiry.user?.name : inquiry.agent?.name;
            const last = inquiry.messages[inquiry.messages.length - 1];
            return (
              <li key={inquiry._id}>
                <Link to={`/inbox/${inquiry._id}`} className="thread-row card">
                  <div className="thread-thumb">
                    {inquiry.listing?.images?.[0]?.url ? (
                      <img src={assetUrl(inquiry.listing.images[0].url)} alt="" />
                    ) : (
                      <span className="muted small">No photo</span>
                    )}
                  </div>
                  <div className="thread-info">
                    <div className="thread-top">
                      <span className="thread-listing">{inquiry.listing?.title || 'Listing removed'}</span>
                      <span className="muted small">{timeAgo(inquiry.lastMessageAt)}</span>
                    </div>
                    <div className="thread-party">
                      <Avatar user={isAgentView ? inquiry.user : inquiry.agent} size={22} />
                      <span className="muted small">
                        {isAgentView ? 'From' : 'To'} {other || 'User'}
                      </span>
                    </div>
                    <p className="thread-preview">{last?.body}</p>
                  </div>
                  <div className="thread-side">
                    {unread > 0 && <span className="unread-badge">{unread}</span>}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
