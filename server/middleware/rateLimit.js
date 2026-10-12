import rateLimit from 'express-rate-limit';

const jsonMessage = (message) => ({ message });

// Broad safety net for the whole API.
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.API_RATE_LIMIT || 600),
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage('Too many requests. Please try again in a few minutes'),
});

// Limits repeated attempts on sign-in, sign-up and password reset.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT || 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage('Too many attempts. Please try again in 15 minutes'),
});

// Keeps address lookups within Nominatim's usage policy.
export const geocodeLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: Number(process.env.GEOCODE_RATE_LIMIT || 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage('Too many address lookups. Please slow down'),
});

// Stops message endpoints (inquiries, chat) being spammed.
export const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: Number(process.env.MESSAGE_RATE_LIMIT || 60),
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage('You are sending messages too quickly. Please slow down'),
});
