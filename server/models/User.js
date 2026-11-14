import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: '', trim: true },
    // select: false keeps the hash out of query results unless asked for
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ['user', 'agent', 'admin'], default: 'user' },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    googleId: { type: String, index: true, sparse: true, unique: true },
    // Only SHA-256 hashes of these tokens are stored
    verifyToken: { type: String, select: false },
    verifyTokenExpires: { type: Date, select: false },
    resetToken: { type: String, select: false },
    resetTokenExpires: { type: Date, select: false },
    // Sessions issued before this moment are rejected.
    passwordChangedAt: { type: Date },

    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Listing' }],

    avatar: {
      url: { type: String },
      publicId: { type: String },
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  if (!this.isNew) this.passwordChangedAt = new Date(Date.now() - 1000);
  if (this.$locals.skipPasswordHash) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.tokenPredatesPassword = function (issuedAtSeconds) {
  if (!this.passwordChangedAt || !issuedAtSeconds) return false;
  return issuedAtSeconds * 1000 < this.passwordChangedAt.getTime();
};

userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

export default mongoose.model('User', userSchema);
