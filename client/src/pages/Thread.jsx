import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errorMessage } from '../api/axios.js';
import Avatar from '../components/Avatar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useInquiries } from '../context/InquiryContext.jsx';

const formatTime = (value) =>
  new Date(value).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function Thread() {
  const { id } = useParams();
  const { user } = useAuth();
  const { refresh, tick } = useInquiries();
  const [inquiry, setInquiry] = useState(null);
  const [message, setMessage] = useState('');
  const [quote, setQuote] = useState(null); // message being quoted
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  const load = async () => {
    try {
      const { data } = await api.get(`/inquiries/${id}`);
      setInquiry(data.inquiry);
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Refetch when the thread opens and whenever a new message arrives by socket.
  useEffect(() => {
    load();
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, tick]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [inquiry]);

  const send = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setBusy(true);
    setError('');
    try {
      await api.post(`/inquiries/${id}/reply`, { message, quotedId: quote?._id });
      setMessage('');
      setQuote(null);
      await load();
      refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="muted center">Loading conversation...</p>;
  if (!inquiry) {
    return (
      <div className="card center empty-state">
        <h2>Conversation unavailable</h2>
        <p className="muted">{error || 'This conversation could not be loaded.'}</p>
        <Link to="/inbox" className="btn btn-primary">
          Back to inbox
        </Link>
      </div>
    );
  }

  const iAmAgent = String(inquiry.agent?._id) === user.id;
  const other = iAmAgent ? inquiry.user : inquiry.agent;
  const otherName = other?.name;
  const listing = inquiry.listing;

  return (
    <section className="thread">
      <header className="thread-head thread-head-row">
        <Avatar user={other} size={46} />
        <div className="thread-head-main">
          <Link to="/inbox" className="muted small">
            ← Inbox
          </Link>
          <h1>{otherName || 'User'}</h1>
          <p className="muted small">
            {listing ? (
              <>
                About <Link to={`/listings/${listing._id}`}>{listing.title}</Link>
              </>
            ) : (
              'Listing removed'
            )}
          </p>
        </div>
      </header>

      <div className="message-thread card">
        {inquiry.messages.map((msg, index) => {
          const mine = String(msg.sender?._id) === user.id;
          return (
            <article key={msg._id || index} className={mine ? 'thread-message mine' : 'thread-message'}>
              <Avatar user={msg.sender} size={36} />
              <div className="thread-message-main">
                <div className="thread-message-head">
                  <span className="thread-message-sender">{mine ? 'You' : msg.sender?.name || 'User'}</span>
                  <span className="muted small">{formatTime(msg.createdAt)}</span>
                </div>

                {msg.quoted?.body && (
                  <blockquote className="quoted">
                    <span className="quoted-sender">
                      {String(msg.quoted.sender?._id) === user.id ? 'You' : msg.quoted.sender?.name || 'User'} wrote
                    </span>
                    <p>{msg.quoted.body}</p>
                  </blockquote>
                )}

                <p className="thread-message-body">{msg.body}</p>

                <button type="button" className="link-btn" onClick={() => setQuote(msg)}>
                  Quote
                </button>
              </div>
            </article>
          );
        })}
        <div ref={endRef} />
      </div>

      {error && <p className="alert alert-error">{error}</p>}

      <form className="reply-form card" onSubmit={send}>
        {quote && (
          <div className="quote-preview">
            <div>
              <span className="quoted-sender">Replying to {String(quote.sender?._id) === user.id ? 'yourself' : quote.sender?.name || 'User'}</span>
              <p className="muted small">{quote.body}</p>
            </div>
            <button type="button" className="link-btn" onClick={() => setQuote(null)}>
              Cancel
            </button>
          </div>
        )}

        <label>
          Reply
          <textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your reply..."
          />
        </label>
        <button className="btn btn-primary" disabled={busy || !message.trim()}>
          {busy ? 'Sending...' : 'Send reply'}
        </button>
      </form>
    </section>
  );
}
