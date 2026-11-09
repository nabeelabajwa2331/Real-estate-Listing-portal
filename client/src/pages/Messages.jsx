import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api, { errorMessage } from '../api/axios.js';
import Avatar from '../components/Avatar.jsx';
import SmartImage from '../components/SmartImage.jsx';
import { assetUrl } from '../config/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useInquiries } from '../context/InquiryContext.jsx';
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

const tabs = [
  ['all', 'All'],
  ['chats', 'Chats'],
  ['inquiries', 'Inquiries'],
];

export default function Messages() {
  const { user } = useAuth();
  const { refresh: refreshInquiries, tick: inquiryTick } = useInquiries();
  const { refresh: refreshChat, tick: chatTick } = useChat();
  const navigate = useNavigate();
  const { chatId, inquiryId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeKind = chatId ? 'chat' : inquiryId ? 'inquiry' : null;

  const tabParam = searchParams.get('tab');
  const tab = tabParam === 'chats' || tabParam === 'inquiries' ? tabParam : 'all';
  const setTab = (next) => setSearchParams(next === 'all' ? {} : { tab: next }, { replace: true });

  const [inquiries, setInquiries] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [filter, setFilter] = useState('');

  const [activeChat, setActiveChat] = useState(null);
  const [activeInquiry, setActiveInquiry] = useState(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadError, setThreadError] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const [showNew, setShowNew] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);

  const messagesRef = useRef(null);
  const searchTimer = useRef();

  const loadList = useCallback(async () => {
    // Agents receive inquiries; everyone can also see inquiries they sent.
    const boxes = user.role === 'agent' ? ['received', 'sent'] : ['sent'];
    const [boxResponses, chatRes] = await Promise.all([
      Promise.all(boxes.map((box) => api.get('/inquiries', { params: { box } }))),
      api.get('/chat/conversations'),
    ]);

    const merged = new Map();
    boxResponses.forEach(({ data }) => {
      data.inquiries.forEach((inquiry) => merged.set(inquiry._id, inquiry));
    });

    return { inquiries: [...merged.values()], conversations: chatRes.data.conversations };
  }, [user.role]);

  useEffect(() => {
    let active = true;
    setListLoading(true);
    setListError('');
    loadList()
      .then(({ inquiries: nextInquiries, conversations: nextConversations }) => {
        if (!active) return;
        setInquiries(nextInquiries);
        setConversations(nextConversations);
      })
      .catch((err) => active && setListError(errorMessage(err)))
      .finally(() => active && setListLoading(false));
    return () => {
      active = false;
    };
  }, [loadList, inquiryTick, chatTick]);

  // Open a direct chat (and mark it read).
  useEffect(() => {
    if (!chatId) {
      setActiveChat(null);
      return undefined;
    }
    let active = true;
    setThreadLoading(true);
    setThreadError('');
    api
      .get(`/chat/conversations/${chatId}`)
      .then(({ data }) => {
        if (!active) return;
        setActiveChat(data.conversation);
        refreshChat();
      })
      .catch((err) => active && setThreadError(errorMessage(err)))
      .finally(() => active && setThreadLoading(false));
    return () => {
      active = false;
    };
  }, [chatId, chatTick, refreshChat]);

  // Open a listing inquiry (and mark it read).
  useEffect(() => {
    if (!inquiryId) {
      setActiveInquiry(null);
      return undefined;
    }
    let active = true;
    setThreadLoading(true);
    setThreadError('');
    api
      .get(`/inquiries/${inquiryId}`)
      .then(({ data }) => {
        if (!active) return;
        setActiveInquiry(data.inquiry);
        refreshInquiries();
      })
      .catch((err) => active && setThreadError(errorMessage(err)))
      .finally(() => active && setThreadLoading(false));
    return () => {
      active = false;
    };
  }, [inquiryId, inquiryTick, refreshInquiries]);

  // Keep the newest message in view.
  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [activeChat, activeInquiry]);

  const inquiryOther = (inquiry) => {
    if (!inquiry) return null;
    return String(inquiry.agent?._id) === user.id ? inquiry.user : inquiry.agent;
  };

  const items = useMemo(() => {
    const chatItems = conversations.map((item) => ({
      kind: 'chat',
      key: `chat-${item.id}`,
      id: item.id,
      to: `/messages/chat/${item.id}`,
      title: item.user?.name || 'User',
      subtitle: item.user?.role || 'Member',
      preview: item.lastMessage?.body || 'No messages yet',
      time: item.updatedAt,
      unread: item.unread || 0,
      avatar: item.user,
      listing: null,
    }));

    const inquiryItems = inquiries.map((inquiry) => {
      const other = inquiryOther(inquiry);
      const isAgent = String(inquiry.agent?._id) === user.id;
      const last = inquiry.messages?.[inquiry.messages.length - 1];
      return {
        kind: 'inquiry',
        key: `inquiry-${inquiry._id}`,
        id: inquiry._id,
        to: `/messages/inquiry/${inquiry._id}`,
        title: other?.name || 'User',
        subtitle: inquiry.listing?.title ? `About ${inquiry.listing.title}` : 'Listing removed',
        preview: last?.body || 'No messages yet',
        time: inquiry.lastMessageAt || inquiry.updatedAt,
        unread: (isAgent ? inquiry.agentUnread : inquiry.userUnread) || 0,
        avatar: other,
        listing: inquiry.listing,
      };
    });

    return [...chatItems, ...inquiryItems].sort(
      (a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime()
    );
  }, [conversations, inquiries, user.id]);

  const counts = useMemo(
    () => ({
      all: items.reduce((sum, item) => sum + item.unread, 0),
      chats: items.filter((item) => item.kind === 'chat').reduce((sum, item) => sum + item.unread, 0),
      inquiries: items.filter((item) => item.kind === 'inquiry').reduce((sum, item) => sum + item.unread, 0),
    }),
    [items]
  );

  const visibleItems = items.filter((item) => {
    if (tab === 'chats' && item.kind !== 'chat') return false;
    if (tab === 'inquiries' && item.kind !== 'inquiry') return false;
    const haystack = `${item.title} ${item.subtitle} ${item.preview}`.toLowerCase();
    return !filter.trim() || haystack.includes(filter.trim().toLowerCase());
  });

  const activeInquiryOther = inquiryOther(activeInquiry);
  const activeTitle = activeKind === 'chat' ? activeChat?.user?.name : activeInquiryOther?.name;
  const activeSubtitle =
    activeKind === 'chat'
      ? activeChat?.user?.role || 'Member'
      : activeInquiry?.listing?.title
        ? `About ${activeInquiry.listing.title}`
        : 'Listing removed';
  const activeMessages = activeKind === 'chat' ? activeChat?.messages || [] : activeInquiry?.messages || [];

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

  const startWith = async (person) => {
    setListError('');
    try {
      const { data } = await api.post('/chat/conversations', { userId: person.id });
      setShowNew(false);
      setSearch('');
      setResults([]);
      navigate(`/messages/chat/${data.conversation.id}`);
      const next = await loadList();
      setInquiries(next.inquiries);
      setConversations(next.conversations);
    } catch (err) {
      setListError(errorMessage(err));
    }
  };

  const send = async (e) => {
    e.preventDefault();
    if (!draft.trim() || !activeKind) return;
    setSending(true);
    setThreadError('');
    try {
      if (activeKind === 'chat') {
        await api.post(`/chat/conversations/${chatId}/messages`, { body: draft });
        const { data } = await api.get(`/chat/conversations/${chatId}`);
        setActiveChat(data.conversation);
        refreshChat();
      } else {
        await api.post(`/inquiries/${inquiryId}/reply`, { message: draft });
        const { data } = await api.get(`/inquiries/${inquiryId}`);
        setActiveInquiry(data.inquiry);
        refreshInquiries();
      }
      setDraft('');
      const { inquiries: nextInquiries, conversations: nextConversations } = await loadList();
      setInquiries(nextInquiries);
      setConversations(nextConversations);
    } catch (err) {
      setThreadError(errorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="messages-page">
      <div className={activeKind ? 'messages-layout has-active' : 'messages-layout'}>
        <aside className="msg-side">
          <div className="msg-side-head">
            <div>
              <h1>Messages</h1>
              <p className="muted small">
                {counts.all > 0 ? `${counts.all} unread` : 'All caught up'}
              </p>
            </div>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => setShowNew((v) => !v)}>
              {showNew ? 'Close' : 'New chat'}
            </button>
          </div>

          {showNew && (
            <div className="msg-new">
              <input
                value={search}
                onChange={onSearchChange}
                placeholder="Search people by name or email"
                autoFocus
              />
              <div className="msg-results">
                {results.map((person) => (
                  <button type="button" key={person.id} className="msg-result" onClick={() => startWith(person)}>
                    <Avatar user={person} size={32} />
                    <span className="msg-result-name">{person.name}</span>
                    <span className="muted small">{person.role}</span>
                  </button>
                ))}
                {searched && results.length === 0 && <p className="muted small">No people found.</p>}
              </div>
            </div>
          )}

          <div className="msg-search">
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search conversations"
              aria-label="Search conversations"
            />
          </div>

          <div className="msg-tabs" role="tablist">
            {tabs.map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                className={tab === key ? 'tab active' : 'tab'}
                onClick={() => setTab(key)}
              >
                {label}
                {key !== 'all' && counts[key] > 0 && <span className="tab-count">{counts[key]}</span>}
              </button>
            ))}
          </div>

          {listError && <p className="alert alert-error msg-alert">{listError}</p>}

          <ul className="msg-list">
            {listLoading && items.length === 0 && <li className="msg-hint muted small">Loading conversations...</li>}

            {!listLoading && visibleItems.length === 0 && (
              <li className="msg-list-empty">
                <p className="muted small">
                  {items.length === 0
                    ? 'No messages yet. Start a chat with an agent or another member.'
                    : 'No conversations match this filter.'}
                </p>
                {items.length === 0 && (
                  <Link to="/listings" className="btn btn-sm">
                    Browse listings
                  </Link>
                )}
              </li>
            )}

            {visibleItems.map((item) => (
              <li key={item.key}>
                <Link to={item.to} className={item.kind === activeKind && item.id === (chatId || inquiryId) ? 'msg-item active' : 'msg-item'}>
                  {item.kind === 'inquiry' && item.listing?.images?.[0]?.url ? (
                    <span className="msg-thumb">
                      <SmartImage src={assetUrl(item.listing.images[0].url)} alt="" loading="lazy" />
                    </span>
                  ) : (
                    <Avatar user={item.avatar} size={42} />
                  )}

                  <span className="msg-item-main">
                    <span className="msg-item-top">
                      <span className="msg-item-name">{item.title}</span>
                      <span className="msg-item-time">{timeAgo(item.time)}</span>
                    </span>
                    <span className="msg-item-sub">{item.subtitle}</span>
                    <span className="msg-item-preview">{item.preview}</span>
                  </span>

                  {item.unread > 0 && <span className="unread-badge">{item.unread}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        <div className="msg-main">
          {threadError && <p className="alert alert-error msg-alert">{threadError}</p>}

          {activeKind ? (
            threadLoading && !activeChat && !activeInquiry ? (
              <p className="muted center msg-loading">Loading conversation...</p>
            ) : (
              <>
                <header className="msg-head">
                  <button
                    type="button"
                    className="msg-back"
                    onClick={() => navigate('/messages')}
                    aria-label="Back to conversations"
                  >
                    ←
                  </button>

                  {activeKind === 'inquiry' && activeInquiry?.listing?.images?.[0]?.url ? (
                    <span className="msg-thumb msg-thumb-head">
                      <SmartImage src={assetUrl(activeInquiry.listing.images[0].url)} alt="" />
                    </span>
                  ) : (
                    <Avatar user={activeKind === 'chat' ? activeChat?.user : activeInquiryOther} size={40} />
                  )}

                  <div className="msg-head-copy">
                    <p className="msg-head-name">{activeTitle || 'Conversation'}</p>
                    <p className="muted small">{activeSubtitle}</p>
                  </div>

                  {activeKind === 'inquiry' && activeInquiry?.listing?._id && (
                    <Link to={`/listings/${activeInquiry.listing._id}`} className="btn btn-sm msg-head-action">
                      View listing
                    </Link>
                  )}
                </header>

                <div className="msg-messages" ref={messagesRef}>
                  {activeMessages.length === 0 && (
                    <p className="muted small msg-hint">No messages yet — say hello to start the conversation.</p>
                  )}

                  {activeMessages.map((msg, index) => {
                    const mine = String(msg.sender?._id) === user.id;
                    return (
                      <div key={msg._id || index} className={mine ? 'msg-row mine' : 'msg-row'}>
                        {!mine && <Avatar user={msg.sender} size={26} />}
                        <div className={mine ? 'msg-bubble mine' : 'msg-bubble'}>
                          <p>{msg.body}</p>
                          <span className="msg-time">{formatTime(msg.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <form className="msg-compose" onSubmit={send}>
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Type a message..."
                    maxLength={2000}
                    aria-label="Message"
                  />
                  <button className="btn btn-primary" disabled={sending || !draft.trim()}>
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </form>
              </>
            )
          ) : (
            <div className="msg-empty">
              <span className="msg-empty-icon" aria-hidden="true">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.9-.9L3 21l1.9-4.6A8.4 8.4 0 0 1 4 11.5a8.4 8.4 0 0 1 8.5-8.4 8.5 8.5 0 0 1 8.5 8.4z" />
                </svg>
              </span>
              <h2>Your messages</h2>
              <p className="muted">
                Inquiries and direct chats are now in one place. Select a conversation, or start a new chat.
              </p>
              <button type="button" className="btn btn-primary" onClick={() => setShowNew(true)}>
                Start a new chat
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
