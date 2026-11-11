// Reports approved listings that are missing the fields a public listing now
// requires: a street address, a city, map coordinates and at least one photo.
//
// With --apply it will geocode missing coordinates from the stored address.
// It never invents a coordinate or a photo. Incomplete listings are left in
// place (and reported) unless you explicitly pass --demote, which moves them
// back to the pending queue so they cannot be shown publicly until fixed.
//
// Usage:
//   npm run backfill-listings
//   npm run backfill-listings -- --apply
//   npm run backfill-listings -- --apply --demote
import 'dotenv/config';
import mongoose from 'mongoose';
import Listing from '../models/Listing.js';

const args = new Set(process.argv.slice(2));
const apply = args.has('--apply');
const demote = args.has('--demote');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const missingCoordinates = (listing) => {
  const coordinates = listing.location?.coordinates;
  return (
    !Array.isArray(coordinates) ||
    coordinates.length !== 2 ||
    !coordinates.every((value) => Number.isFinite(Number(value)))
  );
};

const addressQuery = (listing) =>
  [
    listing.address?.street,
    listing.address?.city,
    listing.address?.state,
    listing.address?.country,
    listing.address?.zip,
  ]
    .filter(Boolean)
    .join(', ');

async function geocode(query) {
  const params = new URLSearchParams({ q: query, format: 'json', limit: '1' });
  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: {
      'User-Agent': process.env.GEOCODE_USER_AGENT || 'real-estate-app/1.0 (backfill)',
      Accept: 'application/json',
    },
  });
  if (!response.ok) throw new Error(`Geocoder returned ${response.status}`);
  const results = await response.json();
  if (!results.length) return null;
  const lat = Number(results[0].lat);
  const lng = Number(results[0].lon);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

async function main() {
  if (!process.env.MONGO_URI) {
    console.error('Set MONGO_URI in server/.env first.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  const listings = await Listing.find({ status: 'approved' }).sort('createdAt');
  const incomplete = [];
  let geocoded = 0;

  for (const listing of listings) {
    const problems = [];
    if (!listing.address?.street?.trim()) problems.push('street address');
    if (!listing.address?.city?.trim()) problems.push('city');
    if (!listing.images?.length) problems.push('photo');
    if (missingCoordinates(listing)) problems.push('map coordinates');

    if (problems.length) {
      incomplete.push({ listing, problems });
    }

    if (apply && missingCoordinates(listing)) {
      const query = addressQuery(listing);
      if (!query) continue;

      try {
        const point = await geocode(query);
        if (point) {
          listing.location = { type: 'Point', coordinates: [point.lng, point.lat] };
          await listing.save();
          geocoded += 1;
          console.log(`Geocoded ${listing._id} (${listing.title})`);
        } else {
          console.log(`No geocoder result for ${listing._id} (${listing.title})`);
        }
      } catch (err) {
        console.error(`Geocode failed for ${listing._id}: ${err.message}`);
      }

      // Nominatim asks clients to make at most one request per second.
      await sleep(1100);
    }

    if (apply && demote) {
      const stillIncomplete =
        !listing.address?.street?.trim() ||
        !listing.address?.city?.trim() ||
        !listing.images?.length ||
        missingCoordinates(listing);
      if (stillIncomplete) {
        listing.status = 'pending';
        listing.rejectionReason =
          'Incomplete listing data: add a street address, city, map coordinates and at least one photo.';
        await listing.save();
        console.log(`Moved ${listing._id} back to pending review`);
      }
    }
  }

  console.log(`\nApproved listings checked: ${listings.length}`);
  console.log(`Incomplete approved listings: ${incomplete.length}`);
  if (geocoded) console.log(`Coordinates filled from the address: ${geocoded}`);
  if (!apply) {
    console.log('Report only. Re-run with --apply to geocode missing coordinates.');
  }

  for (const { listing, problems } of incomplete) {
    console.log(`- ${listing._id} | ${listing.title} | missing: ${problems.join(', ')}`);
  }

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('Backfill failed:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
