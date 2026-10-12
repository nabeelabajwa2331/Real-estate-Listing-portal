import SavedSearch from '../models/SavedSearch.js';
import { cleanSearchParams } from '../utils/query.js';

// GET /api/saved-searches
export const getSavedSearches = async (req, res) => {
  const searches = await SavedSearch.find({ user: req.user._id }).sort('-createdAt');
  res.json({ searches });
};

// POST /api/saved-searches  { name, params }
export const createSavedSearch = async (req, res) => {
  const search = await SavedSearch.create({
    user: req.user._id,
    name: req.body.name.trim(),
    params: cleanSearchParams(req.body.params),
  });
  res.status(201).json({ search, message: 'Search saved' });
};

// DELETE /api/saved-searches/:id
export const deleteSavedSearch = async (req, res) => {
  const search = await SavedSearch.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!search) return res.status(404).json({ message: 'Saved search not found' });
  res.json({ message: 'Saved search removed' });
};
