import 'dotenv/config';
import http from 'http';
import app from './app.js';
import connectDB from './config/db.js';
import { initSocket } from './socket.js';

const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing. Copy .env.example to .env and set it.');
  process.exit(1);
}

// Email is required when verification is on; warn loudly rather than let signups
// silently fail in production.
if (process.env.REQUIRE_EMAIL_VERIFICATION !== 'false' && !process.env.SMTP_HOST && process.env.NODE_ENV === 'production') {
  console.warn(
    'WARNING: email verification is required but SMTP_HOST is not set. ' +
      'New users will not receive a verification email. Set SMTP_* (or set REQUIRE_EMAIL_VERIFICATION=false).'
  );
}

await connectDB();

// Socket.IO attaches to this http server for real-time inquiry delivery.
const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
