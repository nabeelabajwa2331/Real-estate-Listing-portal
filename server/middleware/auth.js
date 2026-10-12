import User from '../models/User.js';
import { readTokenCookie, verifyToken } from '../utils/token.js';

// Requires a valid login. Attaches the user to req.user.
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
  if (!user.isActive) return res.status(403).json({ message: 'This account has been deactivated' });

  req.user = user;
  next();
};

// Like protect, but never blocks the request: attaches req.user when a valid
// cookie is present and simply continues otherwise. Used by public routes that
// still need to recognise an owner (e.g. viewing a pending listing).
export const optionalProtect = async (req, res, next) => {
  const token = readTokenCookie(req);
  if (!token) return next();

  try {
    const payload = verifyToken(token);
    const user = await User.findById(payload.id);
    if (user && user.isActive) req.user = user;
  } catch {
    // ignore invalid/expired tokens for optional auth
  }
  next();
};

// Restricts a route to the given roles. Use after protect.
// Example: router.post('/', protect, authorize('agent'), createListing)
export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to do this' });
    }
    next();
  };
