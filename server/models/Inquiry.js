import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true, trim: true, maxlength: 2000 },
  createdAt: { type: Date, default: Date.now },
  // Snapshot of the message being quoted, when this is a quoted reply.
  quoted: {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    body: { type: String, trim: true, maxlength: 2000 },
  },
});

// One inquiry is a conversation between a buyer (user) and an agent about a
// listing. Messages are embedded; unread counters track each side separately.
const inquirySchema = new mongoose.Schema(
  {
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    subject: { type: String, trim: true, maxlength: 120 },
    messages: { type: [messageSchema], default: [] },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },

    agentUnread: { type: Number, default: 0 },
    userUnread: { type: Number, default: 0 },
    lastMessageAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

export default mongoose.model('Inquiry', inquirySchema);
