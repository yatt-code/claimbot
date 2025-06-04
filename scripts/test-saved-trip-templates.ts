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
 * Test SavedTripTemplate functionality and create test data
 */
async function testSavedTripTemplates(): Promise<{ success: boolean; message: string }> {
  return withDB(async () => {
    try {
      console.log('=== Testing SavedTripTemplate Model ===');
      
      // Test user ID (simulating Clerk user ID)
      const testUserId = 'test_user_debug_123';
      
      // Clean up any existing test data
      console.log('🧹 Cleaning up existing test data...');
      await SavedTripTemplate.deleteMany({ userId: testUserId });
      
      // Create a test saved trip template
      console.log('📝 Creating test saved trip template...');
      const testTemplate = await SavedTripTemplate.create({
        userId: testUserId,
        origin: {
          address: 'Kuala Lumpur, Malaysia',
          lat: 3.139,
          lng: 101.6869
        },
        destination: {
          address: 'Petaling Jaya, Malaysia', 
          lat: 3.1073,
          lng: 101.6067
        },
        roundTrip: true,
        label: 'KL to PJ Trip'
      });
      
      console.log('✅ Created test template:');
      console.log(JSON.stringify(testTemplate.toObject(), null, 2));
      
      // Test finding templates (simulating API route logic)
      console.log('🔍 Finding templates for user...');
      const templates = await SavedTripTemplate.find({ userId: testUserId }).sort({ createdAt: -1 });
      console.log(`📊 Found ${templates.length} templates`);
      
      // Test the response format (similar to API route)
      console.log('🔄 Testing response format conversion...');
      const response = templates.map(template => ({
        ...template.toObject(),
        _id: template._id.toString(),
      }));
      
      console.log('📋 Response format:');
      console.log(JSON.stringify(response, null, 2));
      
      // Test creating a User record for more realistic testing
      console.log('👤 Creating test user record...');
      await User.deleteMany({ clerkId: testUserId });
      
      const testUser = await User.create({
        clerkId: testUserId,
        email: 'test@debug.com',
        name: 'Debug Test User',
        roles: ['staff']
      });
      
      console.log('✅ Created test user:');
      console.log(`   ID: ${testUser._id}`);
      console.log(`   Clerk ID: ${testUser.clerkId}`);
      console.log(`   Email: ${testUser.email}`);
      console.log(`   Roles: ${testUser.roles?.join(', ')}`);
      
      // Create another template to test multiple results
      console.log('📝 Creating second test template...');
      const secondTemplate = await SavedTripTemplate.create({
        userId: testUserId,
        origin: {
          address: 'KLCC, Kuala Lumpur',
          lat: 3.1578,
          lng: 101.7123
        },
        destination: {
          address: 'Sunway Pyramid, Petaling Jaya',
          lat: 3.0738,
          lng: 101.6065
        },
        roundTrip: false,
        label: 'KLCC to Sunway'
      });
      
      console.log('✅ Created second template:');
      console.log(`   Label: ${secondTemplate.label}`);
      console.log(`   Round Trip: ${secondTemplate.roundTrip}`);
      
      // Final test - retrieve all templates
      const allTemplates = await SavedTripTemplate.find({ userId: testUserId }).sort({ createdAt: -1 });
      console.log(`📊 Final count: ${allTemplates.length} templates for user ${testUserId}`);
      
      const successMessage = `\n🎉 Successfully tested SavedTripTemplate functionality!\n` +
        `   - Created ${allTemplates.length} test templates\n` +
        `   - Created test user: ${testUser.email}\n` +
        `   - All database operations completed successfully`;
      
      console.log(successMessage);
      
      return { 
        success: true, 
        message: successMessage
      };
    } catch (error) {
      const errorMessage = `❌ Error testing SavedTripTemplate: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errorMessage);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
      return { success: false, message: errorMessage };
    }
  });
}

/**
 * Test the API endpoint with a mock session
 */
async function testApiEndpoint(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('\n=== Testing API Endpoint ===');
    
    // Import fetch for Node.js
    const fetch = (await import('node-fetch')).default;
    
    // Test the API endpoint without authentication (should get 401 or redirect)
    console.log('🌐 Testing API endpoint without auth...');
    const apiResponse = await fetch('http://localhost:3000/api/saved-trip-templates');
    
    console.log(`📡 API Response Status: ${apiResponse.status}`);
    console.log(`📡 API Response Headers:`, Object.fromEntries(apiResponse.headers.entries()));
    
    const responseText = await apiResponse.text();
    console.log(`📡 API Response Body: ${responseText}`);
    
    if (apiResponse.status === 307 || apiResponse.status === 401) {
      return {
        success: true,
        message: '✅ API endpoint correctly requires authentication (got redirect or 401)'
      };
    } else {
      return {
        success: false,
        message: `❌ Unexpected API response status: ${apiResponse.status}`
      };
    }
  } catch (error) {
    const errorMessage = `❌ Error testing API endpoint: ${error instanceof Error ? error.message : String(error)}`;
    console.error(errorMessage);
    return { success: false, message: errorMessage };
  }
}

// Set up command line interface
const program = new Command();

program
  .name('test-saved-trip-templates')
  .description('Test SavedTripTemplate model and API functionality')
  .version('1.0.0')
  .option('--api-only', 'Only test the API endpoint')
  .option('--db-only', 'Only test the database functionality')
  .action(async (options) => {
    let dbResult = { success: true, message: 'Skipped database test' };
    let apiResult = { success: true, message: 'Skipped API test' };
    
    if (!options.apiOnly) {
      dbResult = await testSavedTripTemplates();
    }
    
    if (!options.dbOnly) {
      apiResult = await testApiEndpoint();
    }
    
    console.log('\n=== Test Summary ===');
    console.log(`Database Test: ${dbResult.success ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`API Test: ${apiResult.success ? '✅ PASSED' : '❌ FAILED'}`);
    
    const overallSuccess = dbResult.success && apiResult.success;
    process.exit(overallSuccess ? 0 : 1);
  });

// Parse command line arguments
if (require.main === module) {
  program.parse(process.argv);
}

export { program, testSavedTripTemplates, testApiEndpoint };