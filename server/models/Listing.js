import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String },
  },
  { _id: false }
);

const listingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },

    listingType: { type: String, enum: ['sale', 'rent'], required: true, default: 'sale' },
    propertyType: {
      type: String,
      enum: ['house', 'apartment', 'plot', 'commercial', 'room'],
      required: true,
      default: 'house',
    },

    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'PKR', trim: true, maxlength: 6 },
    // Only meaningful when listingType is 'rent'
    rentPeriod: { type: String, enum: ['month', 'year'], default: 'month' },

    area: { type: Number, min: 0 }, // square feet
    bedrooms: { type: Number, min: 0, default: 0 },
    bathrooms: { type: Number, min: 0, default: 0 },

    address: {
      street: { type: String, trim: true, maxlength: 200 },
      city: { type: String, required: true, trim: true, maxlength: 80 },
      state: { type: String, trim: true, maxlength: 80 },
      country: { type: String, trim: true, maxlength: 80, default: 'Pakistan' },
      zip: { type: String, trim: true, maxlength: 20 },
    },

    amenities: { type: [String], default: [] },
    images: { type: [imageSchema], default: [] },

    location: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number] },
    },

    agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    rejectionReason: { type: String, trim: true, maxlength: 500 },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    isFeatured: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

listingSchema.index({ title: 'text', description: 'text', 'address.city': 'text' });
listingSchema.index({ 'address.city': 1, listingType: 1, propertyType: 1, price: 1 });
listingSchema.index({ location: '2dsphere' });

export default mongoose.model('Listing', listingSchema);
