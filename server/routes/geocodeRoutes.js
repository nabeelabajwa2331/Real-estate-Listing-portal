import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { geocodeLimiter } from '../middleware/rateLimit.js';
import { geocode } from '../controllers/geocodeController.js';

const router = Router();

// Signed-in agents use this to turn an address into a map pin.
router.get('/', protect, geocodeLimiter, geocode);

export default router;
