import { Router } from 'express';
import { body, param } from 'express-validator';
import validate from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';
import {
  getSavedSearches,
  createSavedSearch,
  deleteSavedSearch,
} from '../controllers/savedSearchController.js';

const router = Router();
router.use(protect);

router.get('/', getSavedSearches);
router.post(
  '/',
  [body('name').trim().isLength({ min: 1, max: 80 }).withMessage('Give the search a name')],
  validate,
  createSavedSearch
);
router.delete('/:id', [param('id').isMongoId().withMessage('Invalid saved search')], validate, deleteSavedSearch);

export default router;
