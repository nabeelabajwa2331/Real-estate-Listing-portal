import Inquiry from '../models/Inquiry.js';
import Listing from '../models/Listing.js';
import User from '../models/User.js';
import sendEmail from '../utils/sendEmail.js';
import { emitToUser } from '../socket.js';

// Emails the other party. The dev fallback in sendEmail prints it to the server
// terminal when SMTP is not configured.
async function notify(recipient, inquiry, listingTitle, fromName, body) {
  if (!recipient?.email) return;
  const link = `${process.env.CLIENT_URL}/inbox/${inquiry._id}`;
  await sendEmail({
    to: recipient.email,
    subject: `New inquiry about "${listingTitle}"`,
    text: `Hi ${recipient.name},\n\n${fromName} wrote:\n\n${body}\n\nReply here: ${link}\n\n— RealEstate`,
  }).catch((err) => console.error('Inquiry email failed:', err.message));
}

// POST /api/inquiries  { listingId, message, subject? }
export const createInquiry = async (req, res) => {
  const { listingId, message, subject } = req.body;

  const listing = await Listing.findById(listingId).populate('agent', 'name email');
  if (!listing) return res.status(404).json({ message: 'Listing not found' });

  if (listing.agent._id.toString() === req.user._id.toString()) {
    return res.status(400).json({ message: 'You cannot inquire about your own listing' });
  }

  const inquiry = await Inquiry.create({
    listing: listing._id,
    user: req.user._id,
    agent: listing.agent._id,
    subject: subject?.trim() || `Inquiry about ${listing.title}`,
    messages: [{ sender: req.user._id, body: message }],
    agentUnread: 1,
    lastMessageAt: new Date(),
  });

  // Real-time push to the agent.
  emitToUser(listing.agent._id, 'inquiry:message', { inquiryId: inquiry._id.toString() });

  await notify(listing.agent, inquiry, listing.title, req.user.name, message);

  res.status(201).json({ inquiry, message: 'Inquiry sent' });
};

// GET /api/inquiries?box=sent|received
export const getInquiries = async (req, res) => {
  const box = req.query.box || (req.user.role === 'agent' ? 'received' : 'sent');
  const filter = box === 'received' ? { agent: req.user._id } : { user: req.user._id };

  const inquiries = await Inquiry.find(filter)
    .sort('-lastMessageAt')
    .populate('listing', 'title images address')
    .populate('user', 'name role avatar')
    .populate('agent', 'name role avatar');

  res.json({ inquiries, box });
};

// GET /api/inquiries/unread-count
export const getUnreadCount = async (req, res) => {
  const [asAgent, asUser] = await Promise.all([
    Inquiry.countDocuments({ agent: req.user._id, agentUnread: { $gt: 0 } }),
    Inquiry.countDocuments({ user: req.user._id, userUnread: { $gt: 0 } }),
  ]);
  res.json({ count: asAgent + asUser });
};

// GET /api/inquiries/:id
export const getInquiry = async (req, res) => {
  const inquiry = await Inquiry.findById(req.params.id)
    .populate('listing', 'title images address')
    .populate('messages.sender', 'name role avatar')
    .populate('messages.quoted.sender', 'name avatar')
    .populate('user', 'name avatar')
    .populate('agent', 'name avatar');

  if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });

  const uid = req.user._id.toString();
  const isAgent = inquiry.agent?._id?.toString() === uid;
  const isUser = inquiry.user?._id?.toString() === uid;
  if (!isAgent && !isUser) return res.status(403).json({ message: 'You are not part of this conversation' });

  // Mark the viewer's side as read without saving populated subdocuments.
  const clear = {};
  if (isAgent && inquiry.agentUnread) clear.agentUnread = 0;
  if (isUser && inquiry.userUnread) clear.userUnread = 0;
  if (Object.keys(clear).length) {
    await Inquiry.updateOne({ _id: inquiry._id }, { $set: clear });
    Object.assign(inquiry, clear);
  }

  res.json({ inquiry });
};

// POST /api/inquiries/:id/reply  { message, quotedId? }
export const replyToInquiry = async (req, res) => {
  const inquiry = await Inquiry.findById(req.params.id);
  if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });

  const uid = req.user._id.toString();
  const isAgent = inquiry.agent.toString() === uid;
  const isUser = inquiry.user.toString() === uid;
  if (!isAgent && !isUser) return res.status(403).json({ message: 'You are not part of this conversation' });

  // Build the message, snapshotting the quoted one when quotedId is given.
  const message = { sender: req.user._id, body: req.body.message };
  if (req.body.quotedId) {
    const original = inquiry.messages.id(req.body.quotedId);
    if (original) message.quoted = { sender: original.sender, body: original.body };
  }

  // Atomic append so we never have to save a populated document.
  const update = {
    $push: { messages: message },
    $set: { lastMessageAt: new Date(), status: 'open' },
    $inc: isAgent ? { userUnread: 1 } : { agentUnread: 1 },
  };
  if (isAgent) update.$set.agentUnread = 0;
  else update.$set.userUnread = 0;

  await Inquiry.updateOne({ _id: inquiry._id }, update);

  const recipientId = isAgent ? inquiry.user : inquiry.agent;

  // Real-time push to the other party.
  emitToUser(recipientId, 'inquiry:message', { inquiryId: inquiry._id.toString() });

  const [recipient, listing] = await Promise.all([
    User.findById(recipientId).select('name email'),
    Listing.findById(inquiry.listing).select('title'),
  ]);
  await notify(recipient, inquiry, listing?.title || 'your listing', req.user.name, req.body.message);

  res.status(201).json({ message: 'Reply sent' });
};
