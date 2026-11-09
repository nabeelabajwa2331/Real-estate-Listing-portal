import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import { emitToUser } from '../socket.js';
import { escapeRegex } from '../utils/query.js';

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
    lastMessage: last ? { body: last.body, createdAt: last.createdAt, sender: last.sender } : null,
    unread,
    updatedAt: conversation.lastMessageAt,
  };
};

// GET /api/chat/conversations
export const getConversations = async (req, res) => {
  const conversations = await Conversation.find({ participants: req.user._id })
    .sort('-lastMessageAt')
    .populate('participants', 'name role avatar');

  res.json({ conversations: conversations.map((c) => summarize(c, req.user._id)) });
};

// POST /api/chat/conversations  { userId }
export const startConversation = async (req, res) => {
  const { userId } = req.body;
  if (userId === req.user._id.toString()) {
    return res.status(400).json({ message: 'You cannot start a chat with yourself' });
  }

  const other = await User.findById(userId);
  if (!other || !other.isActive) return res.status(404).json({ message: 'User not found' });

  let conversation = await Conversation.findOne({
    participants: { $all: [req.user._id, other._id], $size: 2 },
  });

  if (!conversation) {
    conversation = await Conversation.create({ participants: [req.user._id, other._id] });
  }
  await conversation.populate('participants', 'name role avatar');

  res.status(201).json({ conversation: summarize(conversation, req.user._id) });
};

// GET /api/chat/conversations/:id  (marks the other party's messages as read)
export const getConversation = async (req, res) => {
  const uid = req.user._id;
  const conversation = await Conversation.findById(req.params.id)
    .populate('participants', 'name role avatar')
    .populate('messages.sender', 'name role avatar');

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
      messages: conversation.messages,
    },
  });
};

// POST /api/chat/conversations/:id/messages  { body }
export const sendMessage = async (req, res) => {
  const uid = req.user._id;
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

  const isMember = conversation.participants.some((p) => p.toString() === uid.toString());
  if (!isMember) return res.status(403).json({ message: 'You are not part of this conversation' });

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
  const q = String(req.query.q || '').trim();
  if (q.length < 2) return res.json({ users: [] });

  const rx = new RegExp(escapeRegex(q), 'i');
  const users = await User.find({
    _id: { $ne: req.user._id },
    isActive: true,
    $or: [{ name: rx }, { email: rx }],
  })
    .limit(10)
    .select('name role avatar');

  res.json({ users: users.map(publicUser) });
};
