import { Router } from 'express';
import { param } from 'express-validator';
import validate from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';
import {
  getFavoriteIds,
  getFavorites,
  addFavorite,
  removeFavorite,
} from '../controllers/favoriteController.js';

const router = Router();
router.use(protect);

const listingId = () => param('listingId').isMongoId().withMessage('Invalid listing');

router.get('/ids', getFavoriteIds);
router.get('/', getFavorites);
router.post('/:listingId', [listingId()], validate, addFavorite);
router.delete('/:listingId', [listingId()], validate, removeFavorite);

export default router;
