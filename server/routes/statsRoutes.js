import { Router } from 'express';
import { getStats } from '../controllers/statsController.js';

const router = Router();

// Public headline numbers for the home page.
router.get('/', getStats);

export default router;
