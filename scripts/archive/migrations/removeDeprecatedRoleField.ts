#!/usr/bin/env tsx

/**
 * Migration Script: Remove Deprecated Role Field
 * 
 * This script removes the deprecated 'role' field from all User documents
 * in the MongoDB database, ensuring we only use the new 'roles' array.
 * 
 * Usage: npx tsx scripts/migrations/removeDeprecatedRoleField.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI not found in environment variables');
  process.exit(1);
}

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI!);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

async function removeDeprecatedRoleField() {
  try {
    console.log('🔄 Removing deprecated "role" field from User documents...');
    
    // Remove the role field from all documents
    const result = await mongoose.connection.db!
      .collection('users')
      .updateMany(
        { role: { $exists: true } },
        { $unset: { role: 1 } }
      );

    console.log(`✅ Migration completed successfully!`);
    console.log(`📊 Documents modified: ${result.modifiedCount}`);
    console.log(`📊 Documents matched: ${result.matchedCount}`);
    
    if (result.modifiedCount === 0) {
      console.log('ℹ️  No documents needed updating (role field already removed)');
    }

  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Starting migration: Remove deprecated role field');
    console.log('📋 This will remove the old "role" field from all User documents');
    console.log('📋 The new "roles" array will remain intact\n');

    await connectDB();
    await removeDeprecatedRoleField();
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('💡 The deprecated "role" field has been removed from all User documents');
    
  } catch (error) {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Execute migration
if (require.main === module) {
  main();
}

export { removeDeprecatedRoleField };