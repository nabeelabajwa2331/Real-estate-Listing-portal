import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const COOKIE_NAME = 'token';
const days = () => Number(process.env.JWT_EXPIRES_DAYS || 7);

const cookieOptions = () => ({
  httpOnly: true, // not readable from JavaScript
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: process.env.COOKIE_SAMESITE || 'lax',
  path: '/',
});

export const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: `${days()}d`,
  });

export const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET);

export const sendTokenCookie = (res, user) => {
  res.cookie(COOKIE_NAME, signToken(user), {
    ...cookieOptions(),
    maxAge: days() * 24 * 60 * 60 * 1000,
  });
};

export const clearTokenCookie = (res) => res.clearCookie(COOKIE_NAME, cookieOptions());

export const readTokenCookie = (req) => req.cookies?.[COOKIE_NAME];

// Random tokens for email verification and password reset.
// The raw token goes in the emailed link; only its hash is saved.
export const hashToken = (raw) => crypto.createHash('sha256').update(raw).digest('hex');

export const createRandomToken = () => {
  const raw = crypto.randomBytes(32).toString('hex');
  return { raw, hashed: hashToken(raw) };
};
