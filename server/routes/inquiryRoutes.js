import { Router } from 'express';
import { body, param } from 'express-validator';
import validate from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';
import { messageLimiter } from '../middleware/rateLimit.js';
import {
  createInquiry,
  getInquiries,
  getUnreadCount,
  getInquiry,
  replyToInquiry,
} from '../controllers/inquiryController.js';

const router = Router();
router.use(protect);

const message = () =>
  body('message').trim().isLength({ min: 1, max: 2000 }).withMessage('Write a message (up to 2000 characters)');
const id = () => param('id').isMongoId().withMessage('Invalid inquiry');

router.get('/', getInquiries);
router.get('/unread-count', getUnreadCount);

router.post(
  '/',
  messageLimiter,
  [body('listingId').isMongoId().withMessage('Invalid listing'), message()],
  validate,
  createInquiry
);

router.get('/:id', [id()], validate, getInquiry);
router.post(
  '/:id/reply',
  messageLimiter,
  [id(), message(), body('quotedId').optional().isMongoId().withMessage('Invalid quoted message')],
  validate,
  replyToInquiry
);

export default router;
