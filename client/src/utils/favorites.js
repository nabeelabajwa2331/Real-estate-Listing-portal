export function applyFavorite(items, listing, saved) {
  if (!listing?._id) return items;

  if (saved) {
    if (items.some((item) => item._id === listing._id)) return items;
    return [listing, ...items];
  }

  if (!items.some((item) => item._id === listing._id)) return items;
  return items.filter((item) => item._id !== listing._id);
}

export const favoriteIdSet = (items) => new Set(items.map((item) => item._id));
