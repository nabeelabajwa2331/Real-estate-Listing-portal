import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import PendingUser from '../models/PendingUser.js';
import sendEmail from '../utils/sendEmail.js';
import { uploadImages, deleteImage } from '../utils/upload.js';
import {
  sendTokenCookie,
  clearTokenCookie,
  createRandomToken,
  hashToken,
} from '../utils/token.js';

const RESET_MINUTES = 30;
const VERIFY_HOURS = Number(process.env.VERIFY_EXPIRES_HOURS || 24);
const verifyExpiry = () => new Date(Date.now() + VERIFY_HOURS * 60 * 60 * 1000);

// When false (useful in development), registration creates a ready-to-use
// account with no email step. Keep it true in production so real users must
// confirm their email.
const REQUIRE_EMAIL_VERIFICATION = process.env.REQUIRE_EMAIL_VERIFICATION !== 'false';

// Specific addresses that never need email verification (e.g. test accounts),
// even when verification is otherwise required.
const bypassList = () =>
  (process.env.VERIFICATION_BYPASS_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

const bypassesVerification = (email) =>
  !REQUIRE_EMAIL_VERIFICATION || bypassList().includes(String(email).toLowerCase());

// The fields that are safe to send to the browser
const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  role: u.role,
  isVerified: u.isVerified,
  createdAt: u.createdAt,
  avatar: u.avatar?.url || null,
});

async function sendVerificationEmail(user, rawToken) {
  const link = `${process.env.CLIENT_URL}/verify/${rawToken}`;
  await sendEmail({
    to: user.email,
    subject: 'Verify your email',
    text: `Hi ${user.name},\n\nPlease verify your email by opening this link:\n${link}\n\nIf you did not create this account, ignore this email.`,
  });
}

// POST /api/auth/register
export const register = async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  if (await User.findOne({ email })) {
    return res.status(409).json({ message: 'An account with this email already exists' });
  }

  const resolvedRole = role === 'agent' ? 'agent' : 'user'; // admin can never be chosen here

  // Verification disabled (development) or this address is explicitly bypassed:
  // create a usable account immediately, no email step.
  if (bypassesVerification(email)) {
    await User.create({ name, email, phone, password, role: resolvedRole, isVerified: true });
    return res.status(201).json({ message: 'Account created. You can sign in now.' });
  }

  const { raw, hashed } = createRandomToken();
  const passwordHash = await bcrypt.hash(password, 12);

  // No real account is created yet — the signup is held as pending until the
  // email is verified. Unverified signups expire automatically.
  await PendingUser.findOneAndUpdate(
    { email },
    {
      name,
      email,
      phone,
      passwordHash,
      role: resolvedRole,
      verifyToken: hashed,
      verifyTokenExpires: verifyExpiry(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  try {
    await sendVerificationEmail({ name, email }, raw);
  } catch (err) {
    console.error('Verification email failed:', err.message);
    return res.status(201).json({
      message:
        'Almost there, but the verification email could not be sent. Use "Resend verification email" on the sign-in page.',
    });
  }

  res.status(201).json({ message: 'Check your email to verify your address and finish signing up.' });
};

// GET /api/auth/verify/:token
export const verifyEmail = async (req, res) => {
  const hashed = hashToken(req.params.token);

  // Current flow: the account is created only now that the email is verified.
  const pending = await PendingUser.findOne({ verifyToken: hashed }).select('+verifyToken');
  if (pending) {
    if (pending.verifyTokenExpires < new Date()) {
      await PendingUser.deleteOne({ _id: pending._id });
      return res
        .status(400)
        .json({ message: 'This verification link has expired. Request a new one.', code: 'VERIFY_EXPIRED' });
    }

    const user = new User({
      name: pending.name,
      email: pending.email,
      phone: pending.phone,
      password: pending.passwordHash,
      role: pending.role,
      isVerified: true,
    });
    user.$locals.skipPasswordHash = true; // already hashed in the pending record
    await user.save();
    await PendingUser.deleteOne({ _id: pending._id });

    return res.json({ message: 'Email verified. You can now sign in.' });
  }

  // Legacy path for accounts created before pending signups existed.
  const user = await User.findOne({ verifyToken: hashed }).select('+verifyTokenExpires');
  if (!user) {
    return res.status(400).json({ message: 'This verification link is invalid or already used' });
  }

  if (user.verifyTokenExpires && user.verifyTokenExpires < new Date()) {
    user.verifyToken = undefined;
    user.verifyTokenExpires = undefined;
    await user.save();
    return res
      .status(400)
      .json({ message: 'This verification link has expired. Request a new one.', code: 'VERIFY_EXPIRED' });
  }

  user.isVerified = true;
  user.verifyToken = undefined;
  user.verifyTokenExpires = undefined;
  await user.save();

  res.json({ message: 'Email verified. You can now sign in.' });
};

// POST /api/auth/resend-verification
export const resendVerification = async (req, res) => {
  const { email } = req.body;

  const pending = await PendingUser.findOne({ email });
  if (pending) {
    const { raw, hashed } = createRandomToken();
    pending.verifyToken = hashed;
    pending.verifyTokenExpires = verifyExpiry();
    await pending.save();
    await sendVerificationEmail(pending, raw);
  } else {
    const user = await User.findOne({ email });
    if (user && !user.isVerified) {
      const { raw, hashed } = createRandomToken();
      user.verifyToken = hashed;
      user.verifyTokenExpires = verifyExpiry();
      await user.save();
      await sendVerificationEmail(user, raw);
    }
  }

  // Same answer either way, so this cannot be used to discover registered emails
  res.json({ message: 'If that account exists and is not verified, a new link has been sent.' });
};

// POST /api/auth/login
export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    // A pending signup explains the missing account; prompt them to verify.
    if (await PendingUser.findOne({ email })) {
      return res
        .status(403)
        .json({ message: 'Please verify your email before signing in', code: 'NOT_VERIFIED' });
    }
    return res.status(401).json({ message: 'Incorrect email or password' });
  }

  if (!(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Incorrect email or password' });
  }
  if (!user.isVerified) {
    return res
      .status(403)
      .json({ message: 'Please verify your email before signing in', code: 'NOT_VERIFIED' });
  }
  if (!user.isActive) {
    return res.status(403).json({ message: 'This account has been deactivated' });
  }

  sendTokenCookie(res, user);
  res.json({ user: publicUser(user) });
};

// POST /api/auth/logout
export const logout = (req, res) => {
  clearTokenCookie(res);
  res.json({ message: 'Signed out' });
};

// POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (user) {
    const { raw, hashed } = createRandomToken();
    user.resetToken = hashed;
    user.resetTokenExpires = new Date(Date.now() + RESET_MINUTES * 60 * 1000);
    await user.save();

    const link = `${process.env.CLIENT_URL}/reset-password/${raw}`;
    await sendEmail({
      to: user.email,
      subject: 'Reset your password',
      text: `Hi ${user.name},\n\nOpen this link to choose a new password. It expires in ${RESET_MINUTES} minutes:\n${link}\n\nIf you did not ask for this, ignore this email.`,
    });
  }

  res.json({ message: 'If that email is registered, a reset link has been sent.' });
};

// POST /api/auth/reset-password/:token
export const resetPassword = async (req, res) => {
  const user = await User.findOne({
    resetToken: hashToken(req.params.token),
    resetTokenExpires: { $gt: new Date() },
  });
  if (!user) {
    return res.status(400).json({ message: 'This reset link is invalid or has expired' });
  }

  user.password = req.body.password; // hashed by the model's pre-save hook
  user.resetToken = undefined;
  user.resetTokenExpires = undefined;
  // Opening the emailed link also proves the user owns the address
  user.isVerified = true;
  user.verifyToken = undefined;
  user.verifyTokenExpires = undefined;
  await user.save();

  res.json({ message: 'Password changed. You can now sign in.' });
};

// GET /api/auth/me
export const getMe = (req, res) => {
  res.json({ user: publicUser(req.user) });
};

// PUT /api/auth/me
export const updateMe = async (req, res) => {
  const { name, phone, currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;

  if (newPassword) {
    if (!currentPassword || !(await user.matchPassword(currentPassword))) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    user.password = newPassword;
  }

  await user.save();
  res.json({ user: publicUser(user), message: 'Profile updated' });
};

// POST /api/auth/me/avatar  (multipart, field: avatar)
export const updateAvatar = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Choose an image to upload' });

  const user = await User.findById(req.user._id);
  const previous = user.avatar?.publicId ? { publicId: user.avatar.publicId } : null;

  const [uploaded] = await uploadImages([req.file]);
  user.avatar = uploaded;
  await user.save();

  if (previous) await deleteImage(previous);

  res.json({ user: publicUser(user), message: 'Profile photo updated' });
};

// DELETE /api/auth/me/avatar
export const removeAvatar = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user.avatar?.publicId) await deleteImage({ publicId: user.avatar.publicId });

  user.avatar = undefined;
  await user.save();

  res.json({ user: publicUser(user), message: 'Profile photo removed' });
};
