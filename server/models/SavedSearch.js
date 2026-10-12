import mongoose from 'mongoose';

// A stored search is just the query the browse page used, so it can be replayed
// later. `params` is a free-form object but the controller whitelists its keys.
const savedSearchSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    params: { type: Object, default: {} },
  },
  { timestamps: true }
);

export default mongoose.model('SavedSearch', savedSearchSchema);
