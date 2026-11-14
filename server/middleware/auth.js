import User from '../models/User.js';
import { readTokenCookie, verifyToken } from '../utils/token.js';

export const protect = async (req, res, next) => {
  const token = readTokenCookie(req);
  if (!token) return res.status(401).json({ message: 'Please sign in to continue' });

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return res.status(401).json({ message: 'Your session has expired. Please sign in again' });
  }

  const user = await User.findById(payload.id);
  if (!user) return res.status(401).json({ message: 'Account not found' });
  if (user.tokenPredatesPassword(payload.iat)) {
    return res.status(401).json({ message: 'Your password was changed. Please sign in again' });
  }
  if (!user.isActive) {
    return res
      .status(403)
      .json({ message: 'This account has been deactivated', code: 'ACCOUNT_DEACTIVATED' });
  }

  req.user = user;
  next();
};

export const optionalProtect = async (req, res, next) => {
  const token = readTokenCookie(req);
  if (!token) return next();

  try {
    const payload = verifyToken(token);
    const user = await User.findById(payload.id);
    if (user && user.isActive && !user.tokenPredatesPassword(payload.iat)) req.user = user;
  } catch {
    // ignore invalid/expired tokens for optional auth
  }
  next();
};

export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to do this' });
    }
    next();
  };
