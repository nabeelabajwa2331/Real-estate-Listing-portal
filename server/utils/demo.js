// The sample buyer created by the Google fallback is browsing-only. It must
// never be able to contact agents or start a conversation, even by calling the
// API directly.
export const DEMO_BUYER_EMAIL = 'demo.google@example.com';
export const DEMO_BUYER_GOOGLE_ID = 'demo-google-user';

export const DEMO_BUYER_BLOCKED =
  'The sample Google buyer is for browsing only. Contacting agents, sending inquiries and chatting are disabled.';
export const DEMO_BUYER_RECIPIENT_BLOCKED =
  'This is a read-only sample buyer account and cannot receive messages.';

export const isDemoBuyer = (user) =>
  Boolean(user) &&
  user.role === 'user' &&
  (user.googleId === DEMO_BUYER_GOOGLE_ID ||
    String(user.email || '').trim().toLowerCase() === DEMO_BUYER_EMAIL);

// Reusable Mongo filter for checks that only have participant ids.
export const demoBuyerQuery = {
  role: 'user',
  $or: [{ googleId: DEMO_BUYER_GOOGLE_ID }, { email: DEMO_BUYER_EMAIL }],
};
