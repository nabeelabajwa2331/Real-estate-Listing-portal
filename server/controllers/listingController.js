import Listing from '../models/Listing.js';
import { uploadImages, deleteImage } from '../utils/upload.js';
import { escapeRegex } from '../utils/query.js';

const toNumber = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
};

// Like toNumber but also rejects Infinity and other non-finite input, so a bad
// query string (e.g. ?bedrooms=abc) is ignored instead of becoming NaN.
const toFiniteNumber = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

// Multipart form fields arrive as strings, so this shapes req.body into the
// types the schema expects. Only known fields are copied, which also keeps a
// client from setting things like `agent`, `status` or `views`.
function buildPayload(body) {
  const address = {};
  for (const key of ['street', 'city', 'state', 'country', 'zip']) {
    const value = body[key];
    if (value !== undefined) address[key] = String(value).trim();
  }

  const payload = {
    title: body.title?.trim(),
    description: body.description?.trim(),
    listingType: body.listingType,
    propertyType: body.propertyType,
    price: toNumber(body.price),
    currency: body.currency?.trim() || undefined,
    rentPeriod: body.rentPeriod,
    area: toNumber(body.area),
    bedrooms: toNumber(body.bedrooms),
    bathrooms: toNumber(body.bathrooms),
  };

  if (Object.keys(address).length) payload.address = address;

  if (body.amenities !== undefined) {
    payload.amenities = Array.isArray(body.amenities)
      ? body.amenities
      : String(body.amenities)
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean);
  }

  // Optional map coordinates. Only stored when both are valid numbers.
  const lat = toNumber(body.lat);
  const lng = toNumber(body.lng);
  if (lat !== undefined && lng !== undefined) {
    payload.location = { type: 'Point', coordinates: [lng, lat] };
  }

  // Drop keys that were not sent so a partial update never wipes data.
  for (const key of Object.keys(payload)) {
    if (payload[key] === undefined) delete payload[key];
  }
  return payload;
}

const isOwnerOrAdmin = (listing, user) =>
  user.role === 'admin' || listing.agent.toString() === user._id.toString();

// Splits `removeImages` (publicIds the user deleted in the edit form) from the
// listing's current images.
function splitImages(existing, removeImages) {
  const removeIds = new Set(
    Array.isArray(removeImages) ? removeImages : removeImages ? [removeImages] : []
  );
  return {
    keep: existing.filter((img) => !removeIds.has(img.publicId)),
    removed: existing.filter((img) => removeIds.has(img.publicId)),
  };
}

// POST /api/listings  (agent or admin)
export const createListing = async (req, res) => {
  const payload = buildPayload(req.body);
  const images = await uploadImages(req.files);

  const listing = await Listing.create({ ...payload, images, agent: req.user._id });
  res.status(201).json({ listing, message: 'Listing created' });
};

const SORTS = {
  newest: '-createdAt',
  'price-asc': 'price',
  'price-desc': '-price',
  'area-asc': 'area',
  'area-desc': '-area',
};

// Builds a { $gte, $lte } range from validated numbers, or null when neither
// bound is valid.
const buildRange = (min, max) => {
  const low = toFiniteNumber(min);
  const high = toFiniteNumber(max);
  const range = {};
  if (low !== undefined) range.$gte = low;
  if (high !== undefined) range.$lte = high;
  return Object.keys(range).length ? range : null;
};

// GET /api/listings  (signed-in members)
// Filters: city, listingType, propertyType, minPrice, maxPrice, minArea, maxArea,
// bedrooms, q, sort, page, limit, and map bounds (north, south, east, west).
export const getListings = async (req, res) => {
  const { city, listingType, propertyType, bedrooms, q, north, south, east, west } = req.query;
  const page = Math.max(1, toFiniteNumber(req.query.page) || 1);
  const limit = Math.min(48, Math.max(1, toFiniteNumber(req.query.limit) || 12));
  const sort = SORTS[req.query.sort] || SORTS.newest;

  const filter = { status: 'approved' };
  if (city) filter['address.city'] = new RegExp(`^${escapeRegex(city)}$`, 'i');
  if (listingType) filter.listingType = listingType;
  if (propertyType) filter.propertyType = propertyType;

  const minBedrooms = toFiniteNumber(bedrooms);
  if (minBedrooms !== undefined) filter.bedrooms = { $gte: minBedrooms };

  const price = buildRange(req.query.minPrice, req.query.maxPrice);
  if (price) filter.price = price;

  const area = buildRange(req.query.minArea, req.query.maxArea);
  if (area) filter.area = area;

  if (q) filter.$text = { $search: q };

  // Only listings inside the visible map area (all four bounds must be valid).
  const box = {
    north: toFiniteNumber(north),
    south: toFiniteNumber(south),
    east: toFiniteNumber(east),
    west: toFiniteNumber(west),
  };
  if (Object.values(box).every((value) => value !== undefined)) {
    filter.location = { $geoWithin: { $box: [[box.west, box.south], [box.east, box.north]] } };
  }

  const [listings, total] = await Promise.all([
    // Contact details are deliberately not included in the public list: they
    // are only returned from the detail endpoint to signed-in users.
    Listing.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('agent', 'name'),
    Listing.countDocuments(filter),
  ]);

  res.json({ listings, page, pages: Math.ceil(total / limit) || 1, total });
};

// GET /api/listings/mine  (agent or admin)
export const getMyListings = async (req, res) => {
  const listings = await Listing.find({ agent: req.user._id }).sort('-createdAt');
  res.json({ listings });
};

// GET /api/listings/:id  (public, but pending/rejected listings are only
// visible to their owner or an admin)
export const getListing = async (req, res) => {
  // Guests can read the listing, but the agent's phone and email are private:
  // they are only populated for signed-in users.
  const agentFields = req.user ? 'name phone email avatar createdAt' : 'name avatar createdAt';
  const listing = await Listing.findById(req.params.id).populate('agent', agentFields);
  if (!listing) return res.status(404).json({ message: 'Listing not found' });

  const isOwner =
    req.user && (req.user.role === 'admin' || listing.agent?._id?.toString() === req.user._id.toString());
  if (listing.status !== 'approved' && !isOwner) {
    return res.status(404).json({ message: 'Listing not found' });
  }

  listing.views += 1;
  await listing.save();

  // Visitors who are not signed in only get the photos. Everything else
  // (price, address, description, agent contact) requires an account.
  if (!req.user) {
    return res.json({
      listing: {
        _id: listing._id,
        images: listing.images,
      },
    });
  }

  res.json({ listing });
};

// PUT /api/listings/:id  (owner or admin)
export const updateListing = async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return res.status(404).json({ message: 'Listing not found' });
  if (!isOwnerOrAdmin(listing, req.user)) {
    return res.status(403).json({ message: 'You can only edit your own listings' });
  }

  const payload = buildPayload(req.body);
  if (payload.address) {
    // Merge so a form that omits part of the address does not erase it.
    payload.address = { ...listing.address.toObject(), ...payload.address };
  }
  Object.assign(listing, payload);

  // Any edit sends the listing back through review.
  listing.status = 'pending';
  listing.rejectionReason = undefined;
  listing.reviewedBy = undefined;
  listing.reviewedAt = undefined;

  const { keep, removed } = splitImages(listing.images, req.body.removeImages);
  const added = await uploadImages(req.files);
  listing.images = [...keep, ...added];
  await Promise.all(removed.map(deleteImage));

  await listing.save();
  res.json({ listing, message: 'Listing updated' });
};

// DELETE /api/listings/:id  (owner or admin)
export const deleteListing = async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return res.status(404).json({ message: 'Listing not found' });
  if (!isOwnerOrAdmin(listing, req.user)) {
    return res.status(403).json({ message: 'You can only delete your own listings' });
  }

  await Promise.all(listing.images.map(deleteImage));
  await listing.deleteOne();
  res.json({ message: 'Listing deleted' });
};
