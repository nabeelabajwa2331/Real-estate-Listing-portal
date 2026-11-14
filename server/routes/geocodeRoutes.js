import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { geocodeLimiter } from '../middleware/rateLimit.js';
import { geocode } from '../controllers/geocodeController.js';

const router = Router();

router.get('/', protect, geocodeLimiter, geocode);

export default router;
