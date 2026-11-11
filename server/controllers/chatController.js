import Conversation from '../models/Conversation.js';
import Listing from '../models/Listing.js';
import User from '../models/User.js';
import { emitToUser } from '../socket.js';
import { escapeRegex } from '../utils/query.js';
import {
  isDemoBuyer,
  demoBuyerQuery,
  DEMO_BUYER_EMAIL,
  DEMO_BUYER_GOOGLE_ID,
  DEMO_BUYER_BLOCKED,
  DEMO_BUYER_RECIPIENT_BLOCKED,
} from '../utils/demo.js';

const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  role: u.role,
  avatar: u.avatar?.url || null,
});

const otherParticipant = (conversation, userId) =>
  conversation.participants.find((p) => p._id.toString() !== userId.toString());

// Shapes a conversation for the list view.
const summarize = (conversation, userId) => {
  const other = otherParticipant(conversation, userId);
  const last = conversation.messages[conversation.messages.length - 1];
  const unread = conversation.messages.filter(
    (m) => m.sender.toString() !== userId.toString() && !m.readAt
  ).length;

  return {
    id: conversation._id,
    user: other ? publicUser(other) : null,
    listing: conversation.listing || null,
    lastMessage: last ? { body: last.body, createdAt: last.createdAt, sender: last.sender } : null,
    unread,
    updatedAt: conversation.lastMessageAt,
  };
};

// GET /api/chat/conversations
export const getConversations = async (req, res) => {
  const conversations = await Conversation.find({ participants: req.user._id })
    .sort('-lastMessageAt')
    .populate('participants', 'name role avatar')
    .populate('listing', 'title images address');

  res.json({ conversations: conversations.map((c) => summarize(c, req.user._id)) });
};

// POST /api/chat/conversations  { userId, listingId?, body? }
//
// A chat is only created when the first message is actually sent. Calling this
// endpoint without a body returns an existing thread (or a non-persisted draft)
// so opening the composer never leaves an empty conversation in the database.
export const startConversation = async (req, res) => {
  if (isDemoBuyer(req.user)) {
    return res.status(403).json({ message: DEMO_BUYER_BLOCKED });
  }

  const { userId, listingId } = req.body;
  const firstMessage = String(req.body.body || '').trim();
  if (userId === req.user._id.toString()) {
    return res.status(400).json({ message: 'You cannot start a chat with yourself' });
  }

  const other = await User.findById(userId);
  if (!other || !other.isActive) return res.status(404).json({ message: 'User not found' });
  if (isDemoBuyer(other)) {
    return res.status(403).json({ message: DEMO_BUYER_RECIPIENT_BLOCKED });
  }

  // Members and agents can only initiate a conversation with an agent. Admins
  // may also reply to a member. Admins are never a chat target for members.
  if (other.role === 'admin') {
    return res.status(403).json({ message: 'You cannot start a conversation with an administrator' });
  }
  if (req.user.role !== 'admin' && other.role !== 'agent') {
    return res.status(403).json({ message: 'You can only start a conversation with an agent' });
  }

  // When the chat starts from a listing, keep that context on the conversation
  // and make sure the listing really belongs to the agent being contacted.
  let listing = null;
  if (listingId) {
    listing = await Listing.findById(listingId).select('title images address agent status');
    if (!listing || listing.status !== 'approved') {
      return res.status(404).json({ message: 'Listing not found' });
    }
    if (listing.agent.toString() !== other._id.toString()) {
      return res.status(400).json({ message: 'That listing belongs to a different agent' });
    }
  }

  let conversation = await Conversation.findOne({
    participants: { $all: [req.user._id, other._id], $size: 2 },
  });

  if (!conversation) {
    if (!firstMessage) {
      // Nothing is written until the user actually sends something.
      return res.json({
        conversation: {
          id: null,
          user: publicUser(other),
          listing: listing
            ? { _id: listing._id, title: listing.title, images: listing.images, address: listing.address }
            : null,
          messages: [],
        },
        draft: true,
      });
    }

    conversation = await Conversation.create({
      participants: [req.user._id, other._id],
      ...(listing ? { listing: listing._id } : {}),
      messages: [{ sender: req.user._id, body: firstMessage }],
      lastMessageAt: new Date(),
    });
  } else if (firstMessage) {
    const update = {
      $push: { messages: { sender: req.user._id, body: firstMessage } },
      $set: { lastMessageAt: new Date() },
    };
    // Attach the listing context the first time it is known.
    if (listing && !conversation.listing) update.$set.listing = listing._id;
    await Conversation.updateOne({ _id: conversation._id }, update);
    conversation = await Conversation.findById(conversation._id);
  } else if (listing && !conversation.listing) {
    await Conversation.updateOne({ _id: conversation._id }, { $set: { listing: listing._id } });
    conversation = await Conversation.findById(conversation._id);
  }

  await conversation.populate('participants', 'name role avatar');
  await conversation.populate('listing', 'title images address');

  const recipientId = other._id;
  if (firstMessage) {
    emitToUser(recipientId, 'chat:message', { conversationId: conversation._id.toString() });
  }

  res.status(conversation.createdAt && firstMessage ? 201 : 200).json({
    conversation: summarize(conversation, req.user._id),
  });
};

// GET /api/chat/conversations/:id  (marks the other party's messages as read)
export const getConversation = async (req, res) => {
  const uid = req.user._id;
  const conversation = await Conversation.findById(req.params.id)
    .populate('participants', 'name role avatar')
    .populate('messages.sender', 'name role avatar')
    .populate('listing', 'title images address');

  if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

  const isMember = conversation.participants.some((p) => p._id.toString() === uid.toString());
  if (!isMember) return res.status(403).json({ message: 'You are not part of this conversation' });

  // Mark unread messages from the other party as read.
  const unreadIds = conversation.messages
    .filter((m) => m.sender?._id?.toString() !== uid.toString() && !m.readAt)
    .map((m) => m._id);

  if (unreadIds.length) {
    await Conversation.updateOne(
      { _id: conversation._id },
      { $set: { 'messages.$[m].readAt': new Date() } },
      { arrayFilters: [{ 'm._id': { $in: unreadIds } }] }
    );
    for (const message of conversation.messages) {
      if (unreadIds.some((id) => id.equals(message._id))) message.readAt = new Date();
    }
  }

  res.json({
    conversation: {
      id: conversation._id,
      user: publicUser(otherParticipant(conversation, uid)),
      listing: conversation.listing || null,
      messages: conversation.messages,
    },
  });
};

// POST /api/chat/conversations/:id/messages  { body }
export const sendMessage = async (req, res) => {
  if (isDemoBuyer(req.user)) {
    return res.status(403).json({ message: DEMO_BUYER_BLOCKED });
  }

  const uid = req.user._id;
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

  const isMember = conversation.participants.some((p) => p.toString() === uid.toString());
  if (!isMember) return res.status(403).json({ message: 'You are not part of this conversation' });

  // Keep any existing conversation with the sample buyer read-only for the
  // agent as well, so neither side can chat with it.
  const demoParticipant = await User.exists({
    _id: { $in: conversation.participants },
    ...demoBuyerQuery,
  });
  if (demoParticipant) {
    return res.status(403).json({ message: DEMO_BUYER_RECIPIENT_BLOCKED });
  }

  await Conversation.updateOne(
    { _id: conversation._id },
    {
      $push: { messages: { sender: uid, body: req.body.body } },
      $set: { lastMessageAt: new Date() },
    }
  );

  const recipientId = conversation.participants.find((p) => p.toString() !== uid.toString());
  emitToUser(recipientId, 'chat:message', { conversationId: conversation._id.toString() });

  res.status(201).json({ message: 'Message sent' });
};

// GET /api/chat/unread-count
export const getUnreadCount = async (req, res) => {
  const uid = req.user._id;
  const conversations = await Conversation.find({ participants: uid }).select('messages');

  let count = 0; // conversations with at least one unread message
  let messages = 0;
  for (const conversation of conversations) {
    const unread = conversation.messages.filter(
      (m) => m.sender.toString() !== uid.toString() && !m.readAt
    ).length;
    if (unread > 0) {
      count += 1;
      messages += unread;
    }
  }

  res.json({ count, messages });
};

// GET /api/chat/users?q=  (people you can start a chat with)
export const searchUsers = async (req, res) => {
  if (isDemoBuyer(req.user)) return res.json({ users: [] });

  const q = String(req.query.q || '').trim();
  if (q.length < 2) return res.json({ users: [] });

  // Names only — never search by, or expose, an email address. Members and
  // agents may only find agents; admins can also find members to reply to.
  const roles = req.user.role === 'admin' ? ['agent', 'user'] : ['agent'];
  const rx = new RegExp(escapeRegex(q), 'i');
  const users = await User.find({
    _id: { $ne: req.user._id },
    isActive: true,
    role: { $in: roles },
    name: rx,
    // Don't advertise the browsing-only sample buyer as a chat target.
    $nor: [{ googleId: DEMO_BUYER_GOOGLE_ID }, { email: DEMO_BUYER_EMAIL }],
  })
    .limit(10)
    .select('name role avatar');

  res.json({ users: users.map(publicUser) });
};
