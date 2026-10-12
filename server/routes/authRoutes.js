import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { upload } from '../utils/upload.js';
import { isDisallowedEmail, emailDomain, domainCanReceiveMail } from '../utils/email.js';
import {
  register,
  verifyEmail,
  resendVerification,
  login,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
  updateMe,
  updateAvatar,
  removeAvatar,
} from '../controllers/authController.js';

const router = Router();

// Reusable validation rules. Each is a function because a validation chain
// is mutable: calling .optional() on a shared chain would change it everywhere.
const email = () => body('email').trim().isEmail().withMessage('Enter a valid email').toLowerCase();
// Registration additionally rejects placeholder and disposable domains, and
// checks that the domain can actually receive mail (MX/A record), so random
// addresses on non-existent domains cannot sign up.
const realEmail = () =>
  email()
    .custom((value) => {
      if (isDisallowedEmail(value)) {
        throw new Error('Please use a real email address you can access');
      }
      return true;
    })
    .custom(async (value) => {
      if (isDisallowedEmail(value)) return true; // already reported above; skip DNS
      if (!(await domainCanReceiveMail(emailDomain(value)))) {
        throw new Error('That email domain cannot receive mail. Please check the address');
      }
      return true;
    });
const name = () => body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Enter your name');
const phone = () =>
  body('phone')
    .trim()
    .matches(/^\+?[0-9\s-]{7,15}$/)
    .withMessage('Enter a valid phone number');
const password = (field) =>
  body(field).isLength({ min: 8, max: 72 }).withMessage('Password must be at least 8 characters');

router.post(
  '/register',
  authLimiter,
  [
    name(),
    realEmail(),
    phone(),
    password('password'),
    body('role').optional().isIn(['user', 'agent']).withMessage('Role must be user or agent'),
  ],
  validate,
  register
);

router.get('/verify/:token', verifyEmail);
router.post('/resend-verification', authLimiter, [email()], validate, resendVerification);

router.post(
  '/login',
  authLimiter,
  [email(), body('password').notEmpty().withMessage('Enter your password')],
  validate,
  login
);
router.post('/logout', logout);

router.post('/forgot-password', authLimiter, [email()], validate, forgotPassword);
router.post('/reset-password/:token', authLimiter, [password('password')], validate, resetPassword);

router.get('/me', protect, getMe);
router.put(
  '/me',
  protect,
  [name().optional(), phone().optional(), password('newPassword').optional({ values: 'falsy' })],
  validate,
  updateMe
);

router.post('/me/avatar', protect, upload.single('avatar'), updateAvatar);
router.delete('/me/avatar', protect, removeAvatar);

export default router;
