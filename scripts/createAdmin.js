/**
 * Script to create the first admin user.
 * 
 * Usage:
 *   node scripts/createAdmin.js <username> <password>
 * 
 * Example:
 *   node scripts/createAdmin.js admin admin123
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

const createAdmin = async () => {
  const username = process.argv[2];
  const password = process.argv[3];

  if (!username || !password) {
    console.error('Usage: node scripts/createAdmin.js <username> <password>');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    // Check if admin already exists
    const existing = await Admin.findOne({ username });
    if (existing) {
      console.error(`Admin "${username}" already exists.`);
      process.exit(1);
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create admin
    const admin = new Admin({ username, password: hashedPassword });
    await admin.save();

    console.log(`Admin "${username}" created successfully.`);
  } catch (error) {
    console.error('Error creating admin:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createAdmin();
