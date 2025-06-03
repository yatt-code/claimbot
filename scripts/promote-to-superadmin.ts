import { withDB } from '@/lib/server/db';
import User, { UserRole } from '@/models/User';
import { syncUserRolesToClerk } from '@/lib/clerk';
import { Command } from 'commander';

/**
 * Promotes a user to superadmin role
 */
async function promoteToSuperadmin(email: string): Promise<{ success: boolean; message: string }> {
  return withDB(async () => {
    try {
      console.log(`🔍 Looking up user with email: ${email}`);
      
      // Find the user by email (case-insensitive search)
      const user = await User.findOne({ 
        email: { $regex: new RegExp(`^${email}$`, 'i') } 
      });
      
      if (!user) {
        const message = `❌ User with email "${email}" not found`;
        console.error(message);
        return { success: false, message };
      }
      
      console.log(`✅ Found user: ${user.name || 'Unnamed User'} (${user.email})`);
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
      
      const successMessage = `\n🎉 Successfully promoted ${user.email} to superadmin!`;
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
  .argument('<email>', 'Email of the user to promote')
  .action(async (email: string) => {
    const result = await promoteToSuperadmin(email);
    process.exit(result.success ? 0 : 1);
  });

// Parse command line arguments
if (require.main === module) {
  program.parse(process.argv);
}

export { program, promoteToSuperadmin };
