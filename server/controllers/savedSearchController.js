import SavedSearch from '../models/SavedSearch.js';
import { cleanSearchParams, sameSearchParams } from '../utils/query.js';

// GET /api/saved-searches
export const getSavedSearches = async (req, res) => {
  const searches = await SavedSearch.find({ user: req.user._id }).sort('-createdAt');
  res.json({ searches });
};

// POST /api/saved-searches  { name, params }
export const createSavedSearch = async (req, res) => {
  const name = req.body.name.trim();
  const params = cleanSearchParams(req.body.params);

  // Pressing "Save search" twice (or re-saving the same criteria) must not
  // create a second identical record, which would inflate the dashboard count.
  const existing = await SavedSearch.findOne({ user: req.user._id, name });
  if (existing && sameSearchParams(existing.params, params)) {
    return res.status(200).json({
      search: existing,
      duplicate: true,
      message: `"${name}" is already saved`,
    });
  }

  const search = await SavedSearch.create({
    user: req.user._id,
    name,
    params,
  });
  res.status(201).json({ search, message: 'Search saved' });
};

// DELETE /api/saved-searches/:id
export const deleteSavedSearch = async (req, res) => {
  const search = await SavedSearch.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!search) return res.status(404).json({ message: 'Saved search not found' });
  res.json({ message: 'Saved search removed' });
};
