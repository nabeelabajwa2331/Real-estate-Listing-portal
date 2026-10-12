import mongoose from 'mongoose';

// A signup that hasn't confirmed its email yet. Keeping this separate means no
// real user account is created for addresses that never verify, so placeholder
// addresses cannot leave dummy accounts behind. Documents auto-expire via TTL.
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

// Unverified signups are removed automatically if they aren't confirmed.
pendingUserSchema.index({ createdAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 });

export default mongoose.model('PendingUser', pendingUserSchema);
