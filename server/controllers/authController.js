import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import PendingUser from '../models/PendingUser.js';
import sendEmail from '../utils/sendEmail.js';
import { uploadImages, deleteImage } from '../utils/upload.js';
import { normalizePakistaniPhone } from '../utils/phone.js';
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
  const normalizedPhone = normalizePakistaniPhone(phone);

  if (await User.findOne({ email })) {
    return res.status(409).json({ message: 'An account with this email already exists' });
  }

  const resolvedRole = role === 'agent' ? 'agent' : 'user'; // admin can never be chosen here

  // Verification disabled (development) or this address is explicitly bypassed:
  // create a usable account immediately, no email step.
  if (bypassesVerification(email)) {
    await User.create({ name, email, phone: normalizedPhone, password, role: resolvedRole, isVerified: true });
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
      phone: normalizedPhone,
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

// Demo fallback for "Continue with Google". It exists only while no real
// Google client ID is configured, and can be switched off explicitly with
// GOOGLE_DEMO_LOGIN=false. It signs into fixed sample accounts — it is not
// real Google authentication.
const googleDemoEnabled = () => {
  if (String(process.env.GOOGLE_CLIENT_ID || '').trim()) return false;
  const flag = String(process.env.GOOGLE_DEMO_LOGIN ?? 'true').trim().toLowerCase();
  return !['false', '0', 'off', 'no'].includes(flag);
};

// GET /api/auth/google/config
// The browser needs the public OAuth client ID to render Google's button. It
// is read at runtime so a deployment only has to set GOOGLE_CLIENT_ID on the
// server instead of rebuilding the client with VITE_GOOGLE_CLIENT_ID.
export const googleConfig = (req, res) => {
  const clientId = String(process.env.GOOGLE_CLIENT_ID || '').trim();
  // Keep this fresh so changing GOOGLE_CLIENT_ID takes effect on the next page
  // load instead of waiting for a cached "not configured" response to expire.
  res.set('Cache-Control', 'no-store');
  res.json({
    clientId: clientId || null,
    enabled: Boolean(clientId),
    demo: googleDemoEnabled(),
  });
};

// POST /api/auth/google/demo
// Signs into a fixed sample account so the "Continue with Google" option can be
// exercised without a Google Cloud project. Never available once a real client
// ID is set, and can be disabled with GOOGLE_DEMO_LOGIN=false.
export const googleDemoLogin = async (req, res) => {
  if (!googleDemoEnabled()) {
    return res.status(503).json({ message: 'Google demo sign-in is disabled' });
  }

  const role = req.body?.role === 'agent' ? 'agent' : 'user';
  const email = role === 'agent' ? 'demo.google.agent@example.com' : 'demo.google@example.com';
  const googleId = role === 'agent' ? 'demo-google-agent' : 'demo-google-user';

  let user = await User.findOne({ $or: [{ googleId }, { email }] });

  if (!user) {
    user = await User.create({
      name: role === 'agent' ? 'Demo Google Agent' : 'Demo Google Buyer',
      email,
      phone: '',
      // Same approach as a real Google account: a random password nobody knows.
      password: crypto.randomBytes(32).toString('hex'),
      role,
      isVerified: true,
      googleId,
    });
  } else {
    if (!user.isActive) {
      return res.status(403).json({ message: 'This demo account has been deactivated' });
    }

    let changed = false;
    if (!user.googleId) {
      user.googleId = googleId;
      changed = true;
    }
    if (!user.isVerified) {
      user.isVerified = true;
      changed = true;
    }
    if (changed) await user.save();
  }

  sendTokenCookie(res, user);
  res.json({ user: publicUser(user), demo: true });
};

// POST /api/auth/google
// Verifies the Google ID token from the browser and signs the user in. A new
// account is created on first use; an existing account with the same verified
// email is linked to the Google identity.
export const googleLogin = async (req, res) => {
  const { credential } = req.body || {};
  // The register page lets a new Google user choose buyer or agent. Existing
  // accounts keep their current role.
  const requestedRole = req.body?.role === 'agent' ? 'agent' : 'user';
  const clientId = String(process.env.GOOGLE_CLIENT_ID || '').trim();

  if (!clientId) {
    return res.status(503).json({ message: 'Google sign-in is not configured on this server' });
  }
  if (!credential) {
    return res.status(400).json({ message: 'Missing Google credential' });
  }

  let profile;
  try {
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
      { cache: 'no-store', signal: AbortSignal.timeout(8000) }
    );
    if (!response.ok) {
      return res.status(401).json({ message: 'Google sign-in failed. Please try again.' });
    }
    profile = await response.json();
    if (!profile || typeof profile !== 'object') {
      return res.status(401).json({ message: 'Google sign-in could not be verified. Please try again.' });
    }
  } catch {
    return res.status(502).json({ message: 'Could not reach Google. Please try again.' });
  }

  // `aud` is normally a string, but accept an array in case Google returns a
  // multi-audience token. Every other check is the minimum needed to trust the
  // identity: the token must be for this app, issued by Google, and carry a
  // verified email address.
  const audiences = Array.isArray(profile.aud) ? profile.aud : [profile.aud];
  const validIssuer = ['accounts.google.com', 'https://accounts.google.com'].includes(profile.iss);
  const emailVerified = profile.email_verified === true || profile.email_verified === 'true';

  if (
    !profile.sub ||
    !profile.email ||
    !audiences.includes(clientId) ||
    !validIssuer ||
    !emailVerified
  ) {
    return res.status(401).json({ message: 'Google sign-in could not be verified. Please try again.' });
  }

  const email = String(profile.email).trim().toLowerCase();
  let user = await User.findOne({ $or: [{ googleId: profile.sub }, { email }] });

  if (!user) {
    const name =
      String(profile.name || email.split('@')[0]).trim().slice(0, 80) || 'Google user';
    user = await User.create({
      name,
      email,
      phone: '',
      // Google accounts never use password sign-in, so store an unguessable
      // random password instead of leaving the required field empty.
      password: crypto.randomBytes(32).toString('hex'),
      role: requestedRole,
      isVerified: true,
      googleId: profile.sub,
      avatar: profile.picture ? { url: profile.picture } : undefined,
    });
  } else {
    if (!user.isActive) {
      return res.status(403).json({ message: 'This account has been deactivated' });
    }

    let changed = false;
    if (!user.googleId) {
      user.googleId = profile.sub;
      changed = true;
    }
    if (!user.isVerified) {
      user.isVerified = true;
      changed = true;
    }
    if (!user.avatar?.url && profile.picture) {
      user.avatar = { url: profile.picture };
      changed = true;
    }
    if (changed) await user.save();
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
    try {
      await sendEmail({
        to: user.email,
        subject: 'Reset your password',
        text: `Hi ${user.name},\n\nOpen this link to choose a new password. It expires in ${RESET_MINUTES} minutes:\n${link}\n\nIf you did not ask for this, ignore this email.`,
      });
    } catch (err) {
      // Email may be unconfigured; keep the response generic rather than a 500.
      console.error('Password reset email failed:', err.message);
    }
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
  if (phone !== undefined) user.phone = normalizePakistaniPhone(phone);

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
