// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

import { withDB } from '@/lib/server/db';
import User, { UserRole } from '@/models/User';
import { syncUserRolesToClerk } from '@/lib/clerk';
import { Command } from 'commander';

/**
 * Promotes a user to superadmin role
 */
async function promoteToSuperadmin(identifier: string): Promise<{ success: boolean; message: string }> {
  return withDB(async () => {
    try {
      // Check if identifier looks like a Clerk User ID (starts with "user_")
      const isClerkId = identifier.startsWith('user_');
      const searchField = isClerkId ? 'clerkId' : 'email';
      const searchValue = isClerkId ? identifier : { $regex: new RegExp(`^${identifier}$`, 'i') };
      
      console.log(`🔍 Looking up user by ${searchField}: ${identifier}`);
      
      // Find the user by clerkId or email
      const user = await User.findOne({
        [searchField]: searchValue
      });
      
      if (!user) {
        const message = `❌ User with ${searchField} "${identifier}" not found`;
        console.error(message);
        return { success: false, message };
      }
      
      console.log(`✅ Found user: ${user.name || 'Unnamed User'} (${user.email}) [Clerk ID: ${user.clerkId}]`);
      console.log(`📋 Current roles: ${user.roles?.join(', ') || 'None'}`);
      
      // Initialize roles array if it doesn't exist
      if (!user.roles) {
        user.roles = [];
      }
      
      // Check if user already has superadmin role
      if (user.roles.includes('superadmin')) {
        const message = `ℹ️ User ${user.email} already has the superadmin role`;
        console.log(message);
        return { success: true, message };
      }
      
      // Add superadmin role
      user.roles = [...new Set([...user.roles, 'superadmin' as UserRole])];
      await user.save();
      
      console.log('✅ Added superadmin role to user');
      
      try {
        // Sync roles to Clerk
        console.log('🔄 Syncing roles to Clerk...');
        await syncUserRolesToClerk(user.clerkId);
        console.log('✅ Successfully synced roles to Clerk');
      } catch (syncError) {
        console.error('⚠️ Warning: Failed to sync roles to Clerk:', syncError);
        console.log('The user has been updated in the database but Clerk sync failed.');
        console.log('You may need to manually update Clerk or run the sync again later.');
      }
      
      const successMessage = `\n🎉 Successfully promoted ${user.email} (${user.clerkId}) to superadmin!`;
      console.log(successMessage);
      
      return { 
        success: true, 
        message: successMessage,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          roles: user.roles
        }
      };
    } catch (error) {
      const errorMessage = `❌ Error promoting user to superadmin: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  });
}

// Set up command line interface
const program = new Command();

program
  .name('promote-to-superadmin')
  .description('Promote a user to superadmin role')
  .version('1.0.0')
  .argument('<identifier>', 'Clerk User ID (user_xxxxx) or email address of the user to promote')
  .action(async (identifier: string) => {
    const result = await promoteToSuperadmin(identifier);
    process.exit(result.success ? 0 : 1);
  });

// Parse command line arguments
if (require.main === module) {
  program.parse(process.argv);
}

export { program, promoteToSuperadmin };
