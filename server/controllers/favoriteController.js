import User from '../models/User.js';
import Listing from '../models/Listing.js';

// Removes favorites that point at listings which no longer exist, so the stored
// list and every count derived from it stay accurate.
async function pruneMissingFavorites(user) {
  const ids = user.favorites.map(String);
  if (ids.length === 0) return ids;

  const existing = await Listing.find({ _id: { $in: ids } }).select('_id').lean();
  const found = new Set(existing.map((listing) => listing._id.toString()));
  const stale = ids.filter((id) => !found.has(id));

  if (stale.length) {
    await User.updateOne({ _id: user._id }, { $pull: { favorites: { $in: stale } } });
  }
  return ids.filter((id) => found.has(id));
}

// GET /api/favorites/ids  — just the ids, for quick "is this saved?" checks
export const getFavoriteIds = async (req, res) => {
  const user = await User.findById(req.user._id).select('favorites');
  const ids = await pruneMissingFavorites(user);
  res.json({ ids });
};

// GET /api/favorites  — the full listings, newest saved first
export const getFavorites = async (req, res) => {
  const user = await User.findById(req.user._id).select('favorites');
  const ids = await pruneMissingFavorites(user);

  const listings = await Listing.find({ _id: { $in: ids } }).populate('agent', 'name phone');
  const byId = new Map(listings.map((listing) => [listing._id.toString(), listing]));

  // Keep the order the user saved them in (newest first).
  res.json({
    listings: [...ids].reverse().map((id) => byId.get(id)).filter(Boolean),
  });
};

// POST /api/favorites/:listingId
export const addFavorite = async (req, res) => {
  const { listingId } = req.params;

  // Don't let a stale or made-up id end up in the favorites list.
  const exists = await Listing.exists({ _id: listingId });
  if (!exists) return res.status(404).json({ message: 'Listing not found' });

  // $addToSet makes repeated clicks (or retries) idempotent: one listing can
  // never be counted twice.
  await User.findByIdAndUpdate(req.user._id, { $addToSet: { favorites: listingId } });
  res.status(201).json({ message: 'Saved to favorites' });
};

// DELETE /api/favorites/:listingId
export const removeFavorite = async (req, res) => {
  const { listingId } = req.params;
  await User.findByIdAndUpdate(req.user._id, { $pull: { favorites: listingId } });
  res.json({ message: 'Removed from favorites' });
};
