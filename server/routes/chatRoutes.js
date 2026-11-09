import { Router } from 'express';
import { body, param } from 'express-validator';
import validate from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';
import { messageLimiter } from '../middleware/rateLimit.js';
import {
  getConversations,
  startConversation,
  getConversation,
  sendMessage,
  getUnreadCount,
  searchUsers,
} from '../controllers/chatController.js';

const router = Router();
router.use(protect);

const id = () => param('id').isMongoId().withMessage('Invalid conversation');

router.get('/conversations', getConversations);
router.get('/unread-count', getUnreadCount);
router.get('/users', searchUsers);
router.post(
  '/conversations',
  [body('userId').isMongoId().withMessage('Invalid user')],
  validate,
  startConversation
);
router.get('/conversations/:id', [id()], validate, getConversation);
router.post(
  '/conversations/:id/messages',
  messageLimiter,
  [id(), body('body').trim().isLength({ min: 1, max: 2000 }).withMessage('Write a message (up to 2000 characters)')],
  validate,
  sendMessage
);

export default router;
