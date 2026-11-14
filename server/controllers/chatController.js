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

  if (other.role === 'admin') {
    return res.status(403).json({ message: 'You cannot start a conversation with an administrator' });
  }
  if (req.user.role !== 'admin' && other.role !== 'agent') {
    return res.status(403).json({ message: 'You can only start a conversation with an agent' });
  }

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
      messages: [
        { sender: req.user._id, body: firstMessage, ...(listing ? { listing: listing._id } : {}) },
      ],
      lastMessageAt: new Date(),
    });
  } else {
    const topic = listing?._id || conversation.listing;
    const update = { $set: {} };
    if (listing && String(conversation.listing) !== String(listing._id)) {
      update.$set.listing = listing._id;
    }
    if (firstMessage) {
      update.$push = {
        messages: { sender: req.user._id, body: firstMessage, ...(topic ? { listing: topic } : {}) },
      };
      update.$set.lastMessageAt = new Date();
    }
    if (update.$push || Object.keys(update.$set).length) {
      await Conversation.updateOne({ _id: conversation._id }, update);
      conversation = await Conversation.findById(conversation._id);
    }
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
    .populate('messages.listing', 'title')
    .populate('listing', 'title images address');

  if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

  const isMember = conversation.participants.some((p) => p._id.toString() === uid.toString());
  if (!isMember) return res.status(403).json({ message: 'You are not part of this conversation' });

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
      $push: {
        messages: {
          sender: uid,
          body: req.body.body,
          ...(conversation.listing ? { listing: conversation.listing } : {}),
        },
      },
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

  const [row] = await Conversation.aggregate([
    { $match: { participants: uid } },
    {
      $project: {
        unread: {
          $size: {
            $filter: {
              input: '$messages',
              as: 'm',
              cond: {
                $and: [{ $ne: ['$$m.sender', uid] }, { $not: [{ $ifNull: ['$$m.readAt', false] }] }],
              },
            },
          },
        },
      },
    },
    { $match: { unread: { $gt: 0 } } },
    { $group: { _id: null, count: { $sum: 1 }, messages: { $sum: '$unread' } } },
  ]);

  res.json({ count: row?.count || 0, messages: row?.messages || 0 });
};

// GET /api/chat/users?q=  (people you can start a chat with)
export const searchUsers = async (req, res) => {
  if (isDemoBuyer(req.user)) return res.json({ users: [] });

  const q = String(req.query.q || '').trim();
  if (q.length < 2) return res.json({ users: [] });

  const roles = req.user.role === 'admin' ? ['agent', 'user'] : ['agent'];
  const rx = new RegExp(escapeRegex(q), 'i');
  const users = await User.find({
    _id: { $ne: req.user._id },
    isActive: true,
    role: { $in: roles },
    name: rx,
    $nor: [{ googleId: DEMO_BUYER_GOOGLE_ID }, { email: DEMO_BUYER_EMAIL }],
  })
    .limit(10)
    .select('name role avatar');

  res.json({ users: users.map(publicUser) });
};
