// Creates (or promotes) the admin account from the ADMIN_* values in .env.
// Run with: npm run create-admin
import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';

const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PHONE, ADMIN_PASSWORD, MONGO_URI } = process.env;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env first.');
  process.exit(1);
}

await mongoose.connect(MONGO_URI);

let admin = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
if (admin) {
  admin.role = 'admin';
  admin.isVerified = true;
  admin.isActive = true;
  await admin.save();
  console.log(`Existing account ${admin.email} is now an admin.`);
} else {
  admin = await User.create({
    name: ADMIN_NAME || 'Admin',
    email: ADMIN_EMAIL,
    phone: ADMIN_PHONE || '0000000000',
    password: ADMIN_PASSWORD,
    role: 'admin',
    isVerified: true,
  });
  console.log(`Admin created: ${admin.email}`);
}

await mongoose.disconnect();
