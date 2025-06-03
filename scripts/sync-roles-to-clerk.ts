// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

import { withDB } from '@/lib/server/db';
import User from '@/models/User';
import { syncUserRolesToClerk } from '@/lib/clerk';
import { Command } from 'commander';

/**
 * Force sync user roles to Clerk's public metadata
 */
async function forceSyncRolesToClerk(identifier: string): Promise<{ success: boolean; message: string }> {
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
      
      try {
        // Force sync roles to Clerk
        console.log('🔄 Syncing roles to Clerk...');
        const syncResult = await syncUserRolesToClerk(user.clerkId);
        
        if (syncResult) {
          console.log('✅ Successfully synced roles to Clerk');
          const successMessage = `\n🎉 Successfully synced roles for ${user.email} (${user.clerkId}) to Clerk!`;
          console.log(successMessage);
          return { success: true, message: successMessage };
        } else {
          const errorMessage = `❌ Failed to sync roles to Clerk for ${user.email}`;
          console.error(errorMessage);
          return { success: false, message: errorMessage };
        }
      } catch (syncError) {
        const errorMessage = `❌ Error syncing roles to Clerk: ${syncError instanceof Error ? syncError.message : String(syncError)}`;
        console.error(errorMessage);
        return { success: false, message: errorMessage };
      }
    } catch (error) {
      const errorMessage = `❌ Error syncing user roles: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  });
}

// Set up command line interface
const program = new Command();

program
  .name('sync-roles-to-clerk')
  .description('Force sync user roles to Clerk public metadata')
  .version('1.0.0')
  .argument('<identifier>', 'Clerk User ID (user_xxxxx) or email address of the user to sync')
  .action(async (identifier: string) => {
    const result = await forceSyncRolesToClerk(identifier);
    process.exit(result.success ? 0 : 1);
  });

// Parse command line arguments
if (require.main === module) {
  program.parse(process.argv);
}

export { program, forceSyncRolesToClerk };