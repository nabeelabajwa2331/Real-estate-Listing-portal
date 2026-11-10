import Listing from '../models/Listing.js';
import User from '../models/User.js';
import { getIO, getOnlineCount, isUserOnline } from '../socket.js';

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

export const getListingsForReview = async (req, res) => {
  const { status } = req.query;
  const filter = status && status !== 'all' ? { status } : {};

  const [listings, grouped] = await Promise.all([
    Listing.find(filter).sort('-createdAt').populate('agent', 'name email phone'),
    Listing.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  const counts = { pending: 0, approved: 0, rejected: 0 };
  for (const row of grouped) counts[row._id] = row.count;

  res.json({ listings, counts });
};

export const approveListing = async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return res.status(404).json({ message: 'Listing not found' });

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

export const getUsers = async (req, res) => {
  const { role, q } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: rx }, { email: rx }];
  }

  const users = await User.find(filter).sort('-createdAt');
  res.json({
    users: users.map((u) => ({ ...adminUser(u), isOnline: isUserOnline(u._id) })),
    onlineCount: getOnlineCount(),
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
