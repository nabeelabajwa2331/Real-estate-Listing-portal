// Removes accounts that never verified their email (including test/dummy
// signups). Safe to run repeatedly. Run with: npm run purge-unverified
import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';

await mongoose.connect(process.env.MONGO_URI);

const result = await User.deleteMany({ isVerified: false });
console.log(`Removed ${result.deletedCount} unverified account(s).`);

await mongoose.disconnect();
