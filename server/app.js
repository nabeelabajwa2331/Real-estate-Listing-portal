import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js';
import listingRoutes from './routes/listingRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import geocodeRoutes from './routes/geocodeRoutes.js';
import favoriteRoutes from './routes/favoriteRoutes.js';
import savedSearchRoutes from './routes/savedSearchRoutes.js';
import inquiryRoutes from './routes/inquiryRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Behind a reverse proxy (Render, Railway, nginx), so rate limiting sees the
// real client IP rather than the proxy's.
app.set('trust proxy', 1);

app.use(
  helmet({
    // Images (map tiles, Cloudinary) may be loaded cross-origin.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        connectSrc: ["'self'", 'https:', 'wss:'],
        fontSrc: ["'self'", 'data:'],
        workerSrc: ["'self'", 'blob:'],
        upgradeInsecureRequests: null,
      },
    },
  })
);
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true, // allow the auth cookie
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Locally uploaded images (used when Cloudinary is not configured)
app.use('/uploads', express.static(path.join(here, 'uploads')));

// Broad rate limit for the whole API.
app.use('/api', apiLimiter);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/geocode', geocodeRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/saved-searches', savedSearchRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/stats', statsRoutes);

// In production, serve the built React app from this same service and let the
// client-side router handle any non-API path.
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(here, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use(notFound);
app.use(errorHandler);

export default app;
