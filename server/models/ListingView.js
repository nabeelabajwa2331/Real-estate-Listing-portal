import mongoose from 'mongoose';

const listingViewSchema = new mongoose.Schema(
  {
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true, index: true },
    viewerKey: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

listingViewSchema.index({ listing: 1, viewerKey: 1 }, { unique: true });
listingViewSchema.index({ createdAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 });

export default mongoose.model('ListingView', listingViewSchema);
