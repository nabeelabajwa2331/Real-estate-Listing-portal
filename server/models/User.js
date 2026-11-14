import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Optional because Google sign-in does not provide a phone number. Email
    // and password signups still require one in the route validation.
    phone: { type: String, default: '', trim: true },
    // select: false keeps the hash out of query results unless asked for
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ['user', 'agent', 'admin'], default: 'user' },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    // Set for accounts created through Google sign-in.
    googleId: { type: String, index: true, sparse: true, unique: true },
    // Only SHA-256 hashes of these tokens are stored
    verifyToken: { type: String, select: false },
    verifyTokenExpires: { type: Date, select: false },
    resetToken: { type: String, select: false },
    resetTokenExpires: { type: Date, select: false },
    // Sessions issued before this moment are rejected.
    passwordChangedAt: { type: Date },

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
  // Record when an existing account's password changes, so sessions issued
  // before the change stop working (see middleware/auth.js). Back-dated by a
  // second because JWT `iat` is in whole seconds and the session that made the
  // change is re-issued right after saving.
  if (!this.isNew) this.passwordChangedAt = new Date(Date.now() - 1000);
  if (this.$locals.skipPasswordHash) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// True when the token was issued before the password last changed.
userSchema.methods.tokenPredatesPassword = function (issuedAtSeconds) {
  if (!this.passwordChangedAt || !issuedAtSeconds) return false;
  return issuedAtSeconds * 1000 < this.passwordChangedAt.getTime();
};

userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

export default mongoose.model('User', userSchema);
