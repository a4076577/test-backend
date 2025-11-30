import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const seedAdmin = async () => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/uppsc_db';
  
  // Credentials from Env or Defaults
  const adminEmail = process.env.ADMIN_EMAIL || 'abc@abc.in';
  const adminPass = process.env.ADMIN_PASS || 'Abc@123';
  const adminName = 'Super Admin';

  try {
    await mongoose.connect(mongoURI);
    console.log('📦 Connected to MongoDB');

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('⚠️ Admin already exists. Skipping...');
      process.exit(0);
    }

    const admin = new User({
      name: adminName,
      email: adminEmail,
      password: adminPass, // Will be hashed by pre-save hook
      role: 'admin',
      isApproved: true // Auto-approve the seeded admin
    });

    await admin.save();
    console.log(`✅ Admin created successfully: ${adminEmail}`);
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seedAdmin();