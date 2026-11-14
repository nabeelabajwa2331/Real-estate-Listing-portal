import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';

await mongoose.connect(process.env.MONGO_URI);

const result = await User.deleteMany({ isVerified: false });
console.log(`Removed ${result.deletedCount} unverified account(s).`);

await mongoose.disconnect();
