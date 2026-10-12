import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { protect, authorize } from '../middleware/auth.js';
import {
  getListingsForReview,
  approveListing,
  rejectListing,
  getUsers,
  activateUser,
  deactivateUser,
} from '../controllers/adminController.js';

const router = Router();

// Every route here is admin-only.
router.use(protect, authorize('admin'));

// Listing approval queue
router.get('/listings', getListingsForReview);
router.patch('/listings/:id/approve', approveListing);
router.patch(
  '/listings/:id/reject',
  [body('reason').trim().isLength({ min: 3, max: 500 }).withMessage('Enter a reason (3 to 500 characters)')],
  validate,
  rejectListing
);

// User management
router.get('/users', getUsers);
router.patch('/users/:id/activate', activateUser);
router.patch('/users/:id/deactivate', deactivateUser);

export default router;
