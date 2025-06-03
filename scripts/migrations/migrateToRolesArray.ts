import { withDB } from '@/lib/server/db';
import User, { UserRole } from '@/models/User';
import { syncUserRolesToClerk } from '@/lib/clerk';

/**
 * Migrates users from the old single 'role' field to the new 'roles' array
 * and ensures admins get the superadmin role
 */
async function migrateToRolesArray() {
  return withDB(async () => {
    try {
      console.log('🚀 Starting migration: Converting role field to roles array');
      
      // Find all users with the old role field or missing roles array
      const users = await User.find({
        $or: [
          { role: { $exists: true } },
          { roles: { $exists: false } },
          { roles: { $size: 0 } }
        ]
      });
      
      console.log(`👥 Found ${users.length} users to process`);
      
      let updatedCount = 0;
      let processedCount = 0;
      const results = {
        migrated: 0,
        alreadyMigrated: 0,
        errors: 0,
        details: [] as Array<{
          userId: string;
          email: string;
          oldRole?: string;
          newRoles: string[];
          status: 'migrated' | 'skipped' | 'error';
          error?: string;
        }>
      };
      
      for (const user of users) {
        processedCount++;
        const userResult: {
          userId: string;
          email: string;
          oldRole?: string;
          newRoles: string[];
          status: 'migrated' | 'skipped' | 'error';
          error?: string;
        } = {
          userId: user._id.toString(),
          email: user.email,
          oldRole: user.role,
          newRoles: [...(user.roles || [])],
          status: 'skipped'
        };
        
        try {
          // Skip if roles array already has values
          if (user.roles && user.roles.length > 0) {
            userResult.status = 'skipped';
            userResult.newRoles = user.roles;
            results.alreadyMigrated++;
          } else {
            // Initialize roles array from old role field
            user.roles = user.role ? [user.role as UserRole] : [];
            
            // For existing admins, also add superadmin role
            if (user.role === 'admin' && !user.roles.includes('superadmin')) {
              user.roles.push('superadmin');
            }
            
            // Ensure staff role is present for all users
            if (!user.roles.includes('staff')) {
              user.roles.push('staff');
            }
            
            // Save the updated user
            await user.save();
            
            // Sync roles to Clerk if clerkId exists
            if (user.clerkId) {
              try {
                await syncUserRolesToClerk(user.clerkId);
              } catch (syncError) {
                console.warn(`⚠️ Could not sync roles to Clerk for user ${user.email}:`, syncError);
              }
            }
            
            userResult.newRoles = [...user.roles];
            userResult.status = 'migrated';
            updatedCount++;
            results.migrated++;
          }
          
          console.log(`[${processedCount}/${users.length}] ${userResult.status.toUpperCase()}: ${user.email} (${user._id})`);
          console.log(`   ${userResult.oldRole || 'No role'} → [${userResult.newRoles.join(', ')}]`);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.error(`❌ Error processing user ${user.email}:`, errorMsg);
          userResult.status = 'error';
          userResult.error = errorMsg;
          results.errors++;
        }
        
        results.details.push(userResult);
      }
      
      // Print summary
      console.log('\n📊 Migration Summary:');
      console.log('===================');
      console.log(`🔹 Total users processed: ${processedCount}`);
      console.log(`✅ Successfully migrated: ${results.migrated} users`);
      console.log(`⏩ Already migrated/skipped: ${results.alreadyMigrated} users`);
      console.log(`❌ Errors: ${results.errors} users`);
      
      if (results.errors > 0) {
        console.log('\n⚠️ Some users had errors during migration. Check the logs for details.');
      }
      
      if (results.migrated === 0) {
        console.log('\nℹ️ No users needed migration. All users are up to date.');
      } else {
        console.log(`\n🎉 Successfully migrated ${results.migrated} users to the new roles system!`);
      }
      
      return { success: results.errors === 0, ...results };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Migration failed:', errorMsg);
      throw error;
    }
  });
}

// Run the migration if this file is executed directly
if (require.main === module) {
  migrateToRolesArray()
    .then((result) => {
      process.exit(result?.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Migration failed with error:', error);
      process.exit(1);
    });
}

export { migrateToRolesArray };
