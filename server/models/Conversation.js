import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true, trim: true, maxlength: 2000 },
  createdAt: { type: Date, default: Date.now },
  readAt: { type: Date }, // set when the other participant reads it
  // The listing the conversation was about when this message was sent. Two
  // people keep a single thread, so this marks where the topic changed.
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' },
});

// A one-to-one conversation between two users. Messages are embedded.
const conversationSchema = new mongoose.Schema(
  {
    participants: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
      validate: [(value) => value.length === 2, 'A conversation has exactly two participants'],
      index: true,
    },
    messages: { type: [chatMessageSchema], default: [] },
    // Optional context: the listing the chat is currently about. The same two
    // people keep one thread; opening it from another listing switches this.
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' },
    lastMessageAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1, lastMessageAt: -1 });

export default mongoose.model('Conversation', conversationSchema);
