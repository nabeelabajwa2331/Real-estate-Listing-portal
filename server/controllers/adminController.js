import Listing from '../models/Listing.js';
import User from '../models/User.js';
import { getIO, getOnlineCount, isUserOnline } from '../socket.js';
import { listingCompletenessError } from '../utils/listingCompleteness.js';

const adminUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  role: u.role,
  isVerified: u.isVerified,
  isActive: u.isActive,
  createdAt: u.createdAt,
});

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ?page=&limit= with sane bounds, so admin lists stay fast as data grows.
const paging = (query, defaultLimit, maxLimit) => {
  const limit = Math.min(maxLimit, Math.max(1, Number.parseInt(query.limit, 10) || defaultLimit));
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  return { limit, page, skip: (page - 1) * limit };
};

const STATUSES = ['pending', 'approved', 'rejected'];

export const getListingsForReview = async (req, res) => {
  const status = String(req.query.status || '');
  const filter = STATUSES.includes(status) ? { status } : {};
  const { limit, page, skip } = paging(req.query, 30, 100);

  const [listings, total, grouped] = await Promise.all([
    Listing.find(filter).sort('-createdAt').skip(skip).limit(limit).populate('agent', 'name email phone'),
    Listing.countDocuments(filter),
    Listing.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  const counts = { pending: 0, approved: 0, rejected: 0 };
  for (const row of grouped) counts[row._id] = row.count;

  res.json({ listings, counts, page, total, hasMore: skip + listings.length < total });
};

export const approveListing = async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return res.status(404).json({ message: 'Listing not found' });

  // Never publish a record that buyers cannot locate or inspect.
  const incomplete = listingCompletenessError({
    address: listing.address,
    location: listing.location,
    images: listing.images,
  });
  if (incomplete) {
    return res.status(400).json({ message: `Cannot approve: ${incomplete.toLowerCase()}` });
  }

  listing.status = 'approved';
  listing.rejectionReason = undefined;
  listing.reviewedBy = req.user._id;
  listing.reviewedAt = new Date();
  await listing.save();

  res.json({ listing, message: 'Listing approved' });
};

export const rejectListing = async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return res.status(404).json({ message: 'Listing not found' });

  listing.status = 'rejected';
  listing.rejectionReason = req.body.reason.trim();
  listing.reviewedBy = req.user._id;
  listing.reviewedAt = new Date();
  await listing.save();

  res.json({ listing, message: 'Listing rejected' });
};

const ROLES = ['user', 'agent', 'admin'];

export const getUsers = async (req, res) => {
  const role = String(req.query.role || '');
  const q = String(req.query.q || '').trim();
  const filter = {};
  if (ROLES.includes(role)) filter.role = role;
  if (q) {
    const rx = new RegExp(escapeRegex(q.slice(0, 80)), 'i');
    filter.$or = [{ name: rx }, { email: rx }];
  }
  const { limit, page, skip } = paging(req.query, 50, 200);

  const [users, total, grouped] = await Promise.all([
    User.find(filter).sort('-createdAt').skip(skip).limit(limit),
    User.countDocuments(filter),
    // Totals across every account, for the overview metrics.
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
  ]);

  const roleCounts = { user: 0, agent: 0, admin: 0 };
  for (const row of grouped) roleCounts[row._id] = row.count;

  res.json({
    users: users.map((u) => ({ ...adminUser(u), isOnline: isUserOnline(u._id) })),
    onlineCount: getOnlineCount(),
    page,
    total,
    hasMore: skip + users.length < total,
    roleCounts,
  });
};

const setActive = (active) => async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (user._id.toString() === req.user._id.toString()) {
    return res.status(400).json({ message: 'You cannot change your own account status' });
  }

  user.isActive = active;
  await user.save();
  if (!active) getIO()?.in(`user:${user._id}`).disconnectSockets(true);
  res.json({ user: adminUser(user), message: active ? 'User activated' : 'User deactivated' });
};

export const activateUser = setActive(true);
export const deactivateUser = setActive(false);
