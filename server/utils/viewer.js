import crypto from 'crypto';

// Builds the anonymous identifier used to deduplicate listing views.
//
// The raw IP address (or user id) is never stored. A keyed hash makes the
// value stable for the TTL window but useless if the database is leaked. A
// signed-in visitor is identified by their account id; a guest is identified
// by the request IP. The salt should be a long random value in production.
const defaultSalt = () =>
  process.env.VIEW_HASH_SALT || process.env.JWT_SECRET || 'development-view-salt';

export const viewerKey = ({ userId, ip, salt } = {}) => {
  const identity = userId ? `user:${userId}` : `ip:${ip || 'unknown'}`;
  return crypto
    .createHmac('sha256', salt || defaultSalt())
    .update(identity)
    .digest('hex');
};
