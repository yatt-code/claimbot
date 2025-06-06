import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/db";
import User from "@/models/User";
import { protectApiRoute } from "@/lib/auth-utils";

export async function POST() {
  try {
    // Protect route - require admin permissions
    await protectApiRoute({ 
      roles: ['admin', 'superadmin'] 
    });

    await dbConnect();

    // Find the first user to create test data
    const testUser = await User.findOne({ email: { $exists: true } });
    
    if (!testUser) {
      return NextResponse.json({ error: "No users found to create test data" }, { status: 404 });
    }

    console.log('Creating test salary submission for user:', testUser.email);

    // Create a proper salary submission
    testUser.monthlySalary = 5000;
    testUser.hourlyRate = 28.9;
    testUser.salaryVerificationStatus = 'pending';
    testUser.salarySubmittedAt = new Date();
    testUser.salaryVerifiedAt = undefined; // Reset verification data
    testUser.salaryVerifiedBy = undefined;

    await testUser.save();

    console.log('✅ Test salary submission created:', {
      email: testUser.email,
      monthlySalary: testUser.monthlySalary,
      hourlyRate: testUser.hourlyRate,
      salaryVerificationStatus: testUser.salaryVerificationStatus,
      salarySubmittedAt: testUser.salarySubmittedAt
    });

    return NextResponse.json({
      message: "Test salary submission created successfully",
      user: {
        email: testUser.email,
        monthlySalary: testUser.monthlySalary,
        hourlyRate: testUser.hourlyRate,
        salaryVerificationStatus: testUser.salaryVerificationStatus,
        salarySubmittedAt: testUser.salarySubmittedAt
      }
    });

  } catch (error) {
    console.error("Error creating test salary submission:", error);
    
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return new NextResponse("Unauthorized", { status: 401 });
      }
      if (error.message.includes('Forbidden')) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    }
    
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}