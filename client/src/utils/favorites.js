// Pure helpers behind the saved-items store. Kept separate from the React
// context so the optimistic update/rollback rules can be unit tested.

// Returns a new list with `listing` added (newest first) or removed. The same
// listing can never appear twice, which keeps counts and cards in agreement.
export function applyFavorite(items, listing, saved) {
  if (!listing?._id) return items;

  if (saved) {
    if (items.some((item) => item._id === listing._id)) return items;
    return [listing, ...items];
  }

  if (!items.some((item) => item._id === listing._id)) return items;
  return items.filter((item) => item._id !== listing._id);
}

// A quick "is this listing saved?" lookup set.
export const favoriteIdSet = (items) => new Set(items.map((item) => item._id));
