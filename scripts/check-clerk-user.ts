// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

import { clerkClient } from '@clerk/nextjs/server';
import { Command } from 'commander';

/**
 * Check what's in Clerk for a specific user ID
 */
async function checkClerkUser(clerkUserId: string): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`🔍 Looking up Clerk user: ${clerkUserId}`);
    
    // Get Clerk client instance
    const client = await clerkClient();
    
    // Get user from Clerk
    const clerkUser = await client.users.getUser(clerkUserId);
    
    console.log('✅ Found Clerk user:');
    console.log(`   ID: ${clerkUser.id}`);
    console.log(`   Email: ${clerkUser.emailAddresses.map(e => e.emailAddress).join(', ')}`);
    console.log(`   Primary Email: ${clerkUser.primaryEmailAddress?.emailAddress || 'None'}`);
    console.log(`   First Name: ${clerkUser.firstName || 'None'}`);
    console.log(`   Last Name: ${clerkUser.lastName || 'None'}`);
    console.log(`   Username: ${clerkUser.username || 'None'}`);
    console.log(`   Created: ${clerkUser.createdAt}`);
    console.log(`   Last Sign In: ${clerkUser.lastSignInAt || 'Never'}`);
    console.log(`   Public Metadata:`, JSON.stringify(clerkUser.publicMetadata, null, 2));
    console.log(`   Private Metadata:`, JSON.stringify(clerkUser.privateMetadata, null, 2));
    
    return { 
      success: true, 
      message: `Successfully retrieved Clerk user ${clerkUserId}` 
    };
  } catch (error) {
    const errorMessage = `❌ Error checking Clerk user: ${error instanceof Error ? error.message : String(error)}`;
    console.error(errorMessage);
    return { success: false, message: errorMessage };
  }
}

// Set up command line interface
const program = new Command();

program
  .name('check-clerk-user')
  .description('Check what\'s in Clerk for a specific user ID')
  .version('1.0.0')
  .argument('<clerkUserId>', 'Clerk User ID to check (user_xxxxx)')
  .action(async (clerkUserId: string) => {
    const result = await checkClerkUser(clerkUserId);
    process.exit(result.success ? 0 : 1);
  });

// Parse command line arguments
if (require.main === module) {
  program.parse(process.argv);
}

export { program, checkClerkUser };