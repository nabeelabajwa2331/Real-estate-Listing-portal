import mongoose from 'mongoose';

const savedSearchSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    params: { type: Object, default: {} },
  },
  { timestamps: true }
);

export default mongoose.model('SavedSearch', savedSearchSchema);
