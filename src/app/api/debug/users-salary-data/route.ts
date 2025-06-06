import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/db";
import User from "@/models/User";
import { protectApiRoute } from "@/lib/auth-utils";

export async function GET() {
  try {
    // Protect route - require admin permissions
    await protectApiRoute({ 
      roles: ['admin', 'superadmin'] 
    });

    await dbConnect();

    // Get all users with any salary-related data
    const users = await User.find({}).select('email monthlySalary hourlyRate salaryVerificationStatus salarySubmittedAt salaryVerifiedAt createdAt updatedAt');
    
    console.log('DEBUG: All users salary data:', users.map(u => ({
      email: u.email,
      monthlySalary: u.monthlySalary,
      hourlyRate: u.hourlyRate,
      salaryVerificationStatus: u.salaryVerificationStatus,
      salarySubmittedAt: u.salarySubmittedAt,
      salaryVerifiedAt: u.salaryVerifiedAt,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt
    })));

    return NextResponse.json({
      totalUsers: users.length,
      usersWithSalaryData: users.filter(u => u.monthlySalary !== undefined || u.hourlyRate !== undefined),
      usersWithPendingStatus: users.filter(u => u.salaryVerificationStatus === 'pending'),
      usersWithSubmissionDate: users.filter(u => u.salarySubmittedAt),
      allUsersData: users.map(u => ({
        email: u.email,
        monthlySalary: u.monthlySalary,
        hourlyRate: u.hourlyRate,
        salaryVerificationStatus: u.salaryVerificationStatus,
        salarySubmittedAt: u.salarySubmittedAt,
        salaryVerifiedAt: u.salaryVerifiedAt,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt
      }))
    });

  } catch (error) {
    console.error("Error fetching debug salary data:", error);
    
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