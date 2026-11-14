import rateLimit from 'express-rate-limit';

const jsonMessage = (message) => ({ message });

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.API_RATE_LIMIT || 600),
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage('Too many requests. Please try again in a few minutes'),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT || 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage('Too many attempts. Please try again in 15 minutes'),
});

export const geocodeLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: Number(process.env.GEOCODE_RATE_LIMIT || 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage('Too many address lookups. Please slow down'),
});

export const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: Number(process.env.MESSAGE_RATE_LIMIT || 60),
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage('You are sending messages too quickly. Please slow down'),
});
