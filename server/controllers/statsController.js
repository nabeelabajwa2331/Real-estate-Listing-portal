import Listing from '../models/Listing.js';
import User from '../models/User.js';

// GET /api/stats  (public) — headline numbers for the home page.
export const getStats = async (req, res) => {
  const [listings, agents, cities] = await Promise.all([
    Listing.countDocuments({ status: 'approved' }),
    User.countDocuments({ role: 'agent', isActive: true }),
    Listing.distinct('address.city', { status: 'approved' }),
  ]);

  res.json({ listings, agents, cities: cities.filter(Boolean).length });
};
