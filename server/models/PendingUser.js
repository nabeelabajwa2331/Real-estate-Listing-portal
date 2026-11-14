import mongoose from 'mongoose';

const pendingUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    // Already hashed with bcrypt; carried over to the real account on verify.
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'agent'], default: 'user' },
    verifyToken: { type: String, required: true, select: false },
    verifyTokenExpires: { type: Date, required: true },
  },
  { timestamps: true }
);

pendingUserSchema.index({ createdAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 });

export default mongoose.model('PendingUser', pendingUserSchema);
