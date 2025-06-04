// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

import { withDB } from '@/lib/server/db';
import SavedTripTemplate from '@/models/SavedTripTemplate';
import User from '@/models/User';
import { Command } from 'commander';

/**
 * Create a real user and test the API route logic directly
 */
async function testApiWithRealUser(): Promise<{ success: boolean; message: string }> {
  return withDB(async () => {
    try {
      console.log('=== Testing API Route Logic with Real User ===');
      
      // Create a real user that might exist in Clerk
      const realUserId = 'user_2xzK3S2flSFjSKjEnfWbzquIFI3';
      
      // Clean up any existing test data for this user
      console.log('🧹 Cleaning up existing data for real user...');
      await SavedTripTemplate.deleteMany({ userId: realUserId });
      
      // Ensure user exists in database
      console.log('👤 Ensuring user exists in database...');
      let user = await User.findOne({ clerkId: realUserId });
      if (!user) {
        user = await User.create({
          clerkId: realUserId,
          email: 'real-user@test.com',
          name: 'Real Test User',
          roles: ['staff']
        });
        console.log('✅ Created user in database');
      } else {
        console.log('✅ User already exists in database');
      }
      
      // Create some test templates for this user
      console.log('📝 Creating test templates for real user...');
      const template1 = await SavedTripTemplate.create({
        userId: realUserId,
        origin: {
          address: 'KLCC, Kuala Lumpur',
          lat: 3.1578,
          lng: 101.7123
        },
        destination: {
          address: 'Mid Valley Megamall, Kuala Lumpur',
          lat: 3.1176,
          lng: 101.6774
        },
        roundTrip: true,
        label: 'KLCC to Mid Valley'
      });
      
      const template2 = await SavedTripTemplate.create({
        userId: realUserId,
        origin: {
          address: 'Sunway Pyramid, Petaling Jaya',
          lat: 3.0738,
          lng: 101.6065
        },
        destination: {
          address: 'One Utama, Petaling Jaya',
          lat: 3.1502,
          lng: 101.6153
        },
        roundTrip: false,
        label: 'Sunway to One Utama'
      });
      
      console.log('✅ Created 2 test templates');
      
      // Now simulate the exact API route logic
      console.log('🔄 Simulating API route logic...');
      
      // This is the exact logic from the API route
      const templates = await SavedTripTemplate.find({ userId: realUserId }).sort({ createdAt: -1 });
      console.log(`📊 Found ${templates.length} templates`);
      
      // Convert MongoDB documents to plain objects and ensure _id is a string
      const response = templates.map(template => ({
        ...template.toObject(),
        _id: template._id.toString(),
      }));
      
      console.log('📋 API Response format:');
      console.log(JSON.stringify(response, null, 2));
      
      // Test JSON serialization (this might be where the error occurs)
      console.log('🧪 Testing JSON serialization...');
      const jsonString = JSON.stringify(response);
      const parsedBack = JSON.parse(jsonString);
      console.log('✅ JSON serialization successful');
      
      // Test if there are any circular references or problematic data
      console.log('🔍 Checking for potential issues...');
      response.forEach((template, index) => {
        console.log(`Template ${index + 1}:`);
        console.log(`  - ID: ${template._id}`);
        console.log(`  - User ID: ${template.userId}`);
        console.log(`  - Label: ${template.label}`);
        console.log(`  - Origin: ${template.origin.address}`);
        console.log(`  - Destination: ${template.destination.address}`);
        console.log(`  - Round Trip: ${template.roundTrip}`);
        console.log(`  - Created: ${template.createdAt}`);
      });
      
      const successMessage = `\n🎉 Successfully tested API route logic with real user!\n` +
        `   - User: ${user.email} (${realUserId})\n` +
        `   - Templates: ${templates.length}\n` +
        `   - JSON serialization: ✅\n` +
        `   - No errors detected in API logic`;
      
      console.log(successMessage);
      
      return { 
        success: true, 
        message: successMessage
      };
    } catch (error) {
      const errorMessage = `❌ Error testing API with real user: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errorMessage);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
      return { success: false, message: errorMessage };
    }
  });
}

// Set up command line interface
const program = new Command();

program
  .name('test-api-with-real-user')
  .description('Test API route logic with a real user scenario')
  .version('1.0.0')
  .action(async () => {
    const result = await testApiWithRealUser();
    console.log('\n=== Test Summary ===');
    console.log(`Result: ${result.success ? '✅ PASSED' : '❌ FAILED'}`);
    process.exit(result.success ? 0 : 1);
  });

// Parse command line arguments
if (require.main === module) {
  program.parse(process.argv);
}

export { program, testApiWithRealUser };