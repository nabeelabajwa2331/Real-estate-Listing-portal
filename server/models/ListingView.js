import mongoose from 'mongoose';

// One row per counted listing view. The TTL index expires rows after 24 hours,
// which is what enforces "at most one view per viewer per listing per day"
// without storing raw IP addresses. `viewerKey` is a salted hash.
const listingViewSchema = new mongoose.Schema(
  {
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true, index: true },
    viewerKey: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// The unique pair makes duplicate increments impossible even under concurrent
// requests. TTL removes old rows automatically.
listingViewSchema.index({ listing: 1, viewerKey: 1 }, { unique: true });
listingViewSchema.index({ createdAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 });

export default mongoose.model('ListingView', listingViewSchema);
