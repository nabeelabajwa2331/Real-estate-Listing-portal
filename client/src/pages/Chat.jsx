import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { errorMessage } from '../api/axios.js';
import Avatar from '../components/Avatar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useChat } from '../context/ChatContext.jsx';

const timeAgo = (value) => {
  if (!value) return '';
  const mins = Math.round((Date.now() - new Date(value).getTime()) / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(value).toLocaleDateString();
};

const formatTime = (value) =>
  new Date(value).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function Chat() {
  const { id: activeId } = useParams();
  const { user } = useAuth();
  const { refresh, tick } = useChat();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);

  const endRef = useRef(null);
  const searchTimer = useRef();

  const loadConversations = async () => {
    try {
      const { data } = await api.get('/chat/conversations');
      setConversations(data.conversations);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  useEffect(() => {
    if (!activeId) {
      setConversation(null);
      return;
    }
    let active = true;
    api
      .get(`/chat/conversations/${activeId}`)
      .then((res) => {
        if (!active) return;
        setConversation(res.data.conversation);
        refresh(); // opening a conversation clears its unread messages
      })
      .catch((err) => active && setError(errorMessage(err)));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, tick]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [conversation]);

  const onSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    setSearched(false);
    clearTimeout(searchTimer.current);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      try {
        const { data } = await api.get('/chat/users', { params: { q: value.trim() } });
        setResults(data.users);
        setSearched(true);
      } catch {
        // ignore search errors
      }
    }, 300);
  };

  const startWith = async (userId) => {
    setError('');
    try {
      const { data } = await api.post('/chat/conversations', { userId });
      setShowNew(false);
      setSearch('');
      setResults([]);
      await loadConversations();
      navigate(`/chat/${data.conversation.id}`);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const send = async (e) => {
    e.preventDefault();
    if (!draft.trim() || !activeId) return;
    setBusy(true);
    setError('');
    try {
      await api.post(`/chat/conversations/${activeId}/messages`, { body: draft });
      setDraft('');
      const { data } = await api.get(`/chat/conversations/${activeId}`);
      setConversation(data.conversation);
      await loadConversations();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="chat">
      <div className={activeId ? 'chat-layout chat-layout-active' : 'chat-layout'}>
        <aside className="chat-side card">
          <div className="chat-side-head">
            <h1>Messages</h1>
            <button type="button" className="btn btn-sm" onClick={() => setShowNew((v) => !v)}>
              {showNew ? 'Close' : 'New chat'}
            </button>
          </div>

          {showNew && (
            <div className="chat-new">
              <input
                value={search}
                onChange={onSearchChange}
                placeholder="Search people by name or email"
                autoFocus
              />
              <div className="chat-results">
                {results.map((person) => (
                  <button type="button" key={person.id} className="chat-result" onClick={() => startWith(person.id)}>
                    <Avatar user={person} size={32} />
                    <span className="chat-result-name">{person.name}</span>
                    <span className="muted small">{person.role}</span>
                  </button>
                ))}
                {searched && results.length === 0 && <p className="muted small">No people found.</p>}
              </div>
            </div>
          )}

          <ul className="chat-list">
            {conversations.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={item.id === activeId ? 'chat-item active' : 'chat-item'}
                  onClick={() => navigate(`/chat/${item.id}`)}
                >
                  <Avatar user={item.user} size={40} />
                  <div className="chat-item-info">
                    <div className="chat-item-top">
                      <span className="chat-item-name">{item.user?.name || 'User'}</span>
                      <span className="muted small">{timeAgo(item.updatedAt)}</span>
                    </div>
                    <span className="chat-item-preview">{item.lastMessage?.body || 'No messages yet'}</span>
                  </div>
                  {item.unread > 0 && <span className="unread-badge">{item.unread}</span>}
                </button>
              </li>
            ))}
            {conversations.length === 0 && (
              <p className="muted small chat-hint">No conversations yet. Use “New chat” to start one.</p>
            )}
          </ul>
        </aside>

        <div className="chat-main card">
          {error && <p className="alert alert-error">{error}</p>}
          {conversation ? (
            <>
              <header className="chat-main-head">
                <button
                  type="button"
                  className="chat-back"
                  onClick={() => navigate('/chat')}
                  aria-label="Back to conversations"
                >
                  ←
                </button>
                <Avatar user={conversation.user} size={38} />
                <div>
                  <p className="chat-main-name">{conversation.user?.name}</p>
                  <p className="muted small">{conversation.user?.role}</p>
                </div>
              </header>

              <div className="chat-messages">
                {conversation.messages.length === 0 && (
                  <p className="muted small chat-hint">Say hello — no messages yet.</p>
                )}
                {conversation.messages.map((msg, index) => {
                  const mine = String(msg.sender?._id) === user.id;
                  return (
                    <div key={msg._id || index} className={mine ? 'chat-row mine' : 'chat-row'}>
                      {!mine && <Avatar user={msg.sender} size={28} />}
                      <div className={mine ? 'chat-bubble mine' : 'chat-bubble'}>
                        <p>{msg.body}</p>
                        <span className="chat-time">{formatTime(msg.createdAt)}</span>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>

              <form className="chat-compose" onSubmit={send}>
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a message..."
                  maxLength={2000}
                />
                <button className="btn btn-primary" disabled={busy || !draft.trim()}>
                  {busy ? 'Sending...' : 'Send'}
                </button>
              </form>
            </>
          ) : (
            <div className="chat-empty">
              <h2>Your messages</h2>
              <p className="muted">Select a conversation, or start a new one.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
