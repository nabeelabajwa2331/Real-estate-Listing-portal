// A listing is only useful to a buyer when it can actually be found and
// contacted about. These rules are enforced on create and edit (and mirrored by
// the admin review screen) so the public catalogue cannot fill up with
// half-finished records.

export const hasCoordinates = (location) => {
  const coordinates = location?.coordinates;
  return (
    Array.isArray(coordinates) &&
    coordinates.length === 2 &&
    coordinates.every((value) => Number.isFinite(Number(value)))
  );
};

// Returns a human-readable message for the first missing requirement, or an
// empty string when the listing is complete.
export const listingCompletenessError = ({ address, location, images } = {}) => {
  if (!String(address?.street || '').trim()) {
    return 'Add the street address so buyers know where the property is';
  }
  if (!String(address?.city || '').trim()) {
    return 'Add the city';
  }
  if (!hasCoordinates(location)) {
    return 'Set the map location so the listing appears on the map';
  }
  if (!Array.isArray(images) || images.length === 0) {
    return 'Add at least one photo';
  }
  return '';
};
