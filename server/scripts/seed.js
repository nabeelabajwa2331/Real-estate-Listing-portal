// Seeds demo data so every feature (favorites, saved searches, the admin
// approval queue, inquiries and chat) can be seen working right away.
//
// Creates three ready-to-use accounts and a handful of approved listings with
// map coordinates, then prints the login details.
//
// Run with: npm run seed   (from the server folder)
import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Listing from '../models/Listing.js';

const { MONGO_URI } = process.env;

if (!MONGO_URI) {
  console.error('Set MONGO_URI in .env first.');
  process.exit(1);
}

// Passwords meet the 8-character minimum and are hashed by the User model.
const ACCOUNTS = [
  { name: 'Admin User', email: 'admin@example.com', phone: '03000000001', password: 'Admin12345', role: 'admin' },
  { name: 'Ayesha Khan', email: 'agent@example.com', phone: '03000000002', password: 'Agent12345', role: 'agent' },
  { name: 'Bilal Ahmed', email: 'buyer@example.com', phone: '03000000003', password: 'Buyer12345', role: 'user' },
];

// Creates the account, or resets an existing one to a known good state so the
// script can be run repeatedly.
async function upsertAccount(account) {
  let user = await User.findOne({ email: account.email }).select('+password');
  if (!user) {
    return User.create({ ...account, isVerified: true, isActive: true });
  }
  user.name = account.name;
  user.phone = account.phone;
  user.role = account.role;
  user.password = account.password; // re-hashed by the pre-save hook
  user.isVerified = true;
  user.isActive = true;
  await user.save();
  return user;
}

const img = (seed) => ({ url: `https://picsum.photos/seed/${seed}/1200/800` });

const buildListings = (agentId) => [
  {
    title: 'Modern 3-Bedroom Apartment in DHA Phase 6',
    description:
      'A bright, recently renovated apartment with an open plan living area, fitted kitchen and a private balcony overlooking the park. Close to schools, shopping and the beach.',
    listingType: 'sale',
    propertyType: 'apartment',
    price: 32000000,
    area: 2100,
    bedrooms: 3,
    bathrooms: 3,
    address: { street: 'Khayaban-e-Bukhari', city: 'Karachi', state: 'Sindh', country: 'Pakistan' },
    amenities: ['Lift', 'Parking', 'Security', 'Gym'],
    images: [img('dha-apartment-1'), img('dha-apartment-2')],
    location: { type: 'Point', coordinates: [67.0645, 24.8138] },
  },
  {
    title: 'Spacious Family House in Bahria Town',
    description:
      'A well-maintained double-storey house with a large lawn, servant quarters and covered parking for two cars in a secure gated community.',
    listingType: 'sale',
    propertyType: 'house',
    price: 45000000,
    area: 3600,
    bedrooms: 5,
    bathrooms: 4,
    address: { street: 'Sector C', city: 'Lahore', state: 'Punjab', country: 'Pakistan' },
    amenities: ['Lawn', 'Servant Quarters', 'Parking', 'Security'],
    images: [img('bahria-house-1'), img('bahria-house-2')],
    location: { type: 'Point', coordinates: [74.3095, 31.4697] },
  },
  {
    title: 'Furnished 2-Bedroom Flat for Rent in F-11',
    description:
      'Fully furnished flat available on a monthly basis. Includes utilities, high-speed internet and building maintenance. Ideal for a small family or working professionals.',
    listingType: 'rent',
    propertyType: 'apartment',
    price: 145000,
    rentPeriod: 'month',
    area: 1200,
    bedrooms: 2,
    bathrooms: 2,
    address: { street: 'F-11 Markaz', city: 'Islamabad', state: 'Islamabad', country: 'Pakistan' },
    amenities: ['Furnished', 'Internet', 'Parking', 'Backup Power'],
    images: [img('f11-flat-1'), img('f11-flat-2')],
    location: { type: 'Point', coordinates: [72.9791, 33.6885] },
  },
  {
    title: 'Corner Commercial Plot on Main Boulevard',
    description:
      'Prime corner plot with high footfall, suitable for a retail outlet, showroom or office building. All utilities available and clear documentation.',
    listingType: 'sale',
    propertyType: 'plot',
    price: 27500000,
    area: 5000,
    address: { street: 'Main Boulevard', city: 'Rawalpindi', state: 'Punjab', country: 'Pakistan' },
    amenities: ['Corner Plot', 'Utilities'],
    images: [img('rawalpindi-plot-1')],
    location: { type: 'Point', coordinates: [73.0479, 33.5651] },
  },
  {
    title: 'Affordable 2-Bedroom Home in Wapda Town',
    description:
      'A cosy and affordable home in a peaceful neighbourhood, perfect for first-time buyers. Recently painted with a small front lawn.',
    listingType: 'sale',
    propertyType: 'house',
    price: 15500000,
    area: 1800,
    bedrooms: 2,
    bathrooms: 2,
    address: { street: 'Block D', city: 'Faisalabad', state: 'Punjab', country: 'Pakistan' },
    amenities: ['Lawn', 'Parking'],
    images: [img('faisalabad-house-1')],
    location: { type: 'Point', coordinates: [73.0791, 31.4187] },
  },
  {
    title: 'Single Room for Rent near University',
    description:
      'Clean and quiet single room with attached bath, suitable for a student or a working professional. Shared kitchen and lounge available.',
    listingType: 'rent',
    propertyType: 'room',
    price: 35000,
    rentPeriod: 'month',
    area: 250,
    bedrooms: 1,
    bathrooms: 1,
    address: { street: 'Gulgasht Colony', city: 'Multan', state: 'Punjab', country: 'Pakistan' },
    amenities: ['Furnished', 'Internet'],
    images: [img('multan-room-1')],
    location: { type: 'Point', coordinates: [71.5249, 30.1575] },
  },
  {
    title: 'Luxury Villa with Pool in Hayatabad',
    description:
      'An exclusive villa featuring a private swimming pool, landscaped garden and a spacious lounge with floor-to-ceiling windows. Built with premium fittings throughout.',
    listingType: 'sale',
    propertyType: 'house',
    price: 78000000,
    area: 4800,
    bedrooms: 6,
    bathrooms: 6,
    address: { street: 'Phase 7', city: 'Peshawar', state: 'Khyber Pakhtunkhwa', country: 'Pakistan' },
    amenities: ['Pool', 'Garden', 'Parking', 'Security', 'Backup Power'],
    images: [img('peshawar-villa-1'), img('peshawar-villa-2')],
    location: { type: 'Point', coordinates: [71.4370, 33.9905] },
  },
  {
    title: 'Office Space for Rent in Clifton',
    description:
      'Ready-to-move open-plan office space on the second floor of a modern building, with dedicated parking, lift access and 24/7 security.',
    listingType: 'rent',
    propertyType: 'commercial',
    price: 320000,
    rentPeriod: 'month',
    area: 2400,
    address: { street: 'Block 5', city: 'Karachi', state: 'Sindh', country: 'Pakistan' },
    amenities: ['Lift', 'Parking', 'Security', 'Backup Power'],
    images: [img('clifton-office-1')],
    location: { type: 'Point', coordinates: [67.0330, 24.8138] },
  },
];

async function seed() {
  await mongoose.connect(MONGO_URI);

  const [admin, agent, buyer] = await Promise.all(ACCOUNTS.map(upsertAccount));

  // Replace this agent's demo listings so re-runs stay tidy.
  await Listing.deleteMany({ agent: agent._id });
  const listings = await Listing.insertMany(
    buildListings(agent._id).map((listing) => ({ ...listing, agent: agent._id, status: 'approved' }))
  );

  console.log('\nSeed complete.\n');
  console.log(`Accounts (all pre-verified and active):`);
  console.log(`  Admin   ${admin.email}   password: Admin12345`);
  console.log(`  Agent   ${agent.email}   password: Agent12345`);
  console.log(`  Buyer   ${buyer.email}   password: Buyer12345`);
  console.log(`\nListings created: ${listings.length} (all approved, with map coordinates).`);
  console.log('Sign in, browse /listings to see the map, and use the admin account for the approval queue.\n');

  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error('Seed failed:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
