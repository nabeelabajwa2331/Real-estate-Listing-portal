import crypto from 'crypto';

const defaultSalt = () =>
  process.env.VIEW_HASH_SALT || process.env.JWT_SECRET || 'development-view-salt';

export const viewerKey = ({ userId, ip, salt } = {}) => {
  const identity = userId ? `user:${userId}` : `ip:${ip || 'unknown'}`;
  return crypto
    .createHmac('sha256', salt || defaultSalt())
    .update(identity)
    .digest('hex');
};
