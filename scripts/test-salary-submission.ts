import { dbConnect } from "../src/lib/server/db";
import User from "../src/models/User";

async function testSalarySubmission() {
  await dbConnect();

  try {
    // Find a test user (you can replace with actual user email)
    const testUser = await User.findOne({ email: { $exists: true } });
    
    if (!testUser) {
      console.log('No users found in database. Please create a user first.');
      return;
    }

    console.log('Found test user:', testUser.email);
    console.log('Current salary status:', {
      monthlySalary: testUser.monthlySalary,
      hourlyRate: testUser.hourlyRate,
      salaryVerificationStatus: testUser.salaryVerificationStatus,
      salarySubmittedAt: testUser.salarySubmittedAt
    });

    // Simulate salary submission
    testUser.monthlySalary = 5000;
    testUser.hourlyRate = 28.9;
    testUser.salaryVerificationStatus = 'pending';
    testUser.salarySubmittedAt = new Date();

    await testUser.save();

    console.log('✅ Test salary submission created for user:', testUser.email);
    console.log('New salary status:', {
      monthlySalary: testUser.monthlySalary,
      hourlyRate: testUser.hourlyRate,
      salaryVerificationStatus: testUser.salaryVerificationStatus,
      salarySubmittedAt: testUser.salarySubmittedAt
    });

    console.log('🔄 Now check /admin/salary-verification to see the pending request');

  } catch (error) {
    console.error('Error creating test salary submission:', error);
  }

  process.exit(0);
}

testSalarySubmission();