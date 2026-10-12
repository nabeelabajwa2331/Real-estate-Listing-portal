import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    // select: false keeps the hash out of query results unless asked for
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ['user', 'agent', 'admin'], default: 'user' },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    // Only SHA-256 hashes of these tokens are stored
    verifyToken: { type: String, select: false },
    verifyTokenExpires: { type: Date, select: false },
    resetToken: { type: String, select: false },
    resetTokenExpires: { type: Date, select: false },

    // Listings this user has saved
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Listing' }],

    // Optional profile photo; initials are shown when this is empty.
    avatar: {
      url: { type: String },
      publicId: { type: String },
    },
  },
  { timestamps: true }
);

// Hash the password whenever it is set or changed
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  // PendingUser carries a pre-hashed password over; skip re-hashing it.
  if (this.$locals.skipPasswordHash) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

export default mongoose.model('User', userSchema);
