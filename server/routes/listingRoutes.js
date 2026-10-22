import { Router } from 'express';
import { body, param } from 'express-validator';
import validate from '../middleware/validate.js';
import { protect, authorize, optionalProtect } from '../middleware/auth.js';
import { upload } from '../utils/upload.js';
import {
  createListing,
  getListings,
  getMyListings,
  getListing,
  updateListing,
  deleteListing,
} from '../controllers/listingController.js';

const router = Router();

// Multipart body types: numbers arrive as strings, so isFloat/isInt do the
// checking and buildPayload() converts them for the schema.
const rules = [
  body('title').trim().isLength({ min: 5, max: 120 }).withMessage('Enter a title of 5 to 120 characters'),
  body('description')
    .trim()
    .isLength({ min: 20, max: 5000 })
    .withMessage('Enter a description of at least 20 characters'),
  body('listingType').isIn(['sale', 'rent']).withMessage('Choose sale or rent'),
  body('propertyType')
    .isIn(['house', 'apartment', 'plot', 'commercial', 'room'])
    .withMessage('Choose a property type'),
  body('price').isFloat({ min: 0 }).withMessage('Enter a valid price'),
  body('area').optional({ values: 'falsy' }).isFloat({ min: 0 }).withMessage('Enter a valid area'),
  body('bedrooms').optional({ values: 'falsy' }).isInt({ min: 0 }).withMessage('Enter a valid number of bedrooms'),
  body('bathrooms').optional({ values: 'falsy' }).isInt({ min: 0 }).withMessage('Enter a valid number of bathrooms'),
  body('city').trim().notEmpty().withMessage('Enter the city'),
  body('lat').optional({ values: 'falsy' }).isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  body('lng').optional({ values: 'falsy' }).isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
];

const id = () => param('id').isMongoId().withMessage('Invalid listing');

// Browsing the catalogue is a member feature. Shared detail links stay public
// for guests, but they only receive the photos from getListing below.
router.get('/', protect, getListings);

// The signed-in agent's own listings. Must come before '/:id'.
router.get('/mine', protect, authorize('agent', 'admin'), getMyListings);

// Public detail (owner/admin can also see pending or rejected listings)
router.get('/:id', optionalProtect, [id()], validate, getListing);

router.post(
  '/',
  protect,
  authorize('agent', 'admin'),
  upload.array('images', 10),
  rules,
  validate,
  createListing
);

router.put(
  '/:id',
  protect,
  authorize('agent', 'admin'),
  upload.array('images', 10),
  [id(), ...rules],
  validate,
  updateListing
);

router.delete('/:id', protect, authorize('agent', 'admin'), [id()], validate, deleteListing);

export default router;
