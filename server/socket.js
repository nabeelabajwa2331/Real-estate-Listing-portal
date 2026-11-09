import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from './models/User.js';

let io;

const parseCookies = (header = '') =>
  Object.fromEntries(
    header
      .split(';')
      .map((part) => {
        const index = part.indexOf('=');
        if (index === -1) return null;
        return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
      })
      .filter(Boolean)
  );

// Attaches Socket.IO to the existing http server and authenticates each
// connection with the same httpOnly JWT cookie the REST API uses.
export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = parseCookies(socket.handshake.headers.cookie).token;
      if (!token) return next(new Error('unauthorized'));

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.id);
      if (!user || !user.isActive) return next(new Error('unauthorized'));

      socket.userId = user._id.toString();
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    // Every user gets their own room so messages can be pushed to them.
    socket.join(`user:${socket.userId}`);
  });

  return io;
}

export const getIO = () => io;

// Pushes an event to one user (all of that user's open tabs).
export const emitToUser = (userId, event, payload) => {
  if (io) io.to(`user:${userId}`).emit(event, payload);
};
