const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// User model schema (copy from your models)
const UserSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true },
  name: { type: String },
  email: { type: String, required: true, unique: true },
  department: { type: String },
  designation: { type: String },
  role: { type: String, required: true, enum: ['staff', 'manager', 'finance', 'admin'] },
  salary: { type: Number },
  hourlyRate: { type: Number },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

async function setupFirstAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Replace this with your actual Clerk User ID
    const CLERK_USER_ID = 'user_2xwx0uFvMoLVIJILabKmNNibsH3'; // Get this from Clerk dashboard
    
    // Update the user to admin role
    const result = await User.updateOne(
      { clerkId: CLERK_USER_ID },
      { 
        $set: { 
          role: 'admin',
          name: 'System Admin', // Optional: update name
          department: 'IT',     // Optional: update department
          designation: 'Administrator' // Optional: update designation
        } 
      }
    );

    if (result.matchedCount === 0) {
      console.log('User not found. Creating admin user...');
      // If user doesn't exist, create them as admin
      await User.create({
        clerkId: CLERK_USER_ID,
        name: 'System Admin',
        email: 'admin@company.com', // Replace with your email
        department: 'IT',
        designation: 'Administrator',
        role: 'admin',
        isActive: true,
        salary: 0,
        hourlyRate: 0,
      });
      console.log('Admin user created successfully!');
    } else {
      console.log('User role updated to admin successfully!');
    }

  } catch (error) {
    console.error('Error setting up admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

setupFirstAdmin();