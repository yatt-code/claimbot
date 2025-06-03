// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

import { withDB } from '@/lib/server/db';
import User, { UserRole } from '@/models/User';
import { syncUserRolesToClerk } from '@/lib/clerk';

/**
 * Migration script to add superadmin role to all admin users
 * This script should be run once after deploying the RBAC changes
 */
async function addSuperadminRole() {
  return withDB(async () => {
    try {
      console.log('Starting migration: Adding superadmin role to admin users');
      
      // Find all users who are admins (checking both old role field and new roles array)
      const adminUsers = await User.find({
        $or: [
          { role: 'admin' },
          { roles: { $in: ['admin'] } }
        ]
      });
      
      console.log(`Found ${adminUsers.length} admin users to process`);
      
      let updatedCount = 0;
      let processedCount = 0;
      
      for (const user of adminUsers) {
        try {
          processedCount++;
          const roles = new Set<UserRole>(user.roles || []);
          const originalRoles = [...roles];
          
          // Add superadmin role if not already present
          roles.add('superadmin');
          
          // If roles actually changed, update the user
          if (roles.size !== originalRoles.length) {
            user.roles = Array.from(roles);
            await user.save();
            
            // Sync roles to Clerk
            await syncUserRolesToClerk(user.clerkId);
            
            console.log(`[${processedCount}/${adminUsers.length}] Updated user ${user.email} with roles: ${user.roles.join(', ')}`);
            updatedCount++;
          } else {
            console.log(`[${processedCount}/${adminUsers.length}] User ${user.email} already has superadmin role`);
          }
        } catch (userError) {
          console.error(`Error processing user ${user.email || user._id}:`, userError);
          // Continue with next user even if one fails
        }
      }
      
      console.log(`\nMigration complete.`);
      console.log(`- Processed: ${processedCount} users`);
      console.log(`- Updated: ${updatedCount} users with superadmin role`);
      
      return { success: true, updatedCount, processedCount };
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  });
}

// Run the migration if this file is executed directly
if (require.main === module) {
  addSuperadminRole()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Migration failed with error:', error);
      process.exit(1);
    });
}

export { addSuperadminRole };
