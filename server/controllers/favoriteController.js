import User from '../models/User.js';

// GET /api/favorites/ids  — just the ids, for quick "is this saved?" checks
export const getFavoriteIds = async (req, res) => {
  const user = await User.findById(req.user._id).select('favorites');
  res.json({ ids: user.favorites.map((id) => id.toString()) });
};

// GET /api/favorites  — the full listings, newest saved first
export const getFavorites = async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: 'favorites',
    populate: { path: 'agent', select: 'name phone' },
  });

  // Drop listings that have since been deleted, keeping the saved order.
  const listings = user.favorites.filter(Boolean).reverse();
  res.json({ listings });
};

// POST /api/favorites/:listingId
export const addFavorite = async (req, res) => {
  const { listingId } = req.params;
  await User.findByIdAndUpdate(req.user._id, { $addToSet: { favorites: listingId } });
  res.status(201).json({ message: 'Saved to favorites' });
};

// DELETE /api/favorites/:listingId
export const removeFavorite = async (req, res) => {
  const { listingId } = req.params;
  await User.findByIdAndUpdate(req.user._id, { $pull: { favorites: listingId } });
  res.json({ message: 'Removed from favorites' });
};
