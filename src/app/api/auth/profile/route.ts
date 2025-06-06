import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/db";
import User from "@/models/User";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await dbConnect();

  try {
    // FIXED: Use direct collection query to avoid Mongoose caching issues
    const user = await User.collection.findOne({ clerkId: userId });

    if (!user) {
      // If user exists in Clerk but not in our DB,
      // we might want to create a basic user record here
      // or handle this during a webhook event.
      // For now, return not found or a basic response.
      return new NextResponse("User not found in database", { status: 404 });
    }

    // Calculate monthly OT hours remaining for current month
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    const monthlyOtHoursUsed = user.monthlyOvertimeHours?.get?.(currentMonth) || 0;
    const monthlyOtHoursRemaining = Math.max(0, 18 - monthlyOtHoursUsed);

    console.log('Profile API - User salary status (FIXED):', {
      userId: user.clerkId,
      salaryVerificationStatus: user.salaryVerificationStatus,
      monthlySalary: user.monthlySalary,
      monthlyOtHoursRemaining
    });

    // Return user profile data with salary verification status
    return NextResponse.json({
      _id: user._id,
      clerkId: user.clerkId,
      name: user.name,
      email: user.email,
      department: user.department,
      designation: user.designation,
      roles: user.roles,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      // Salary verification data - FIXED to use correct field values
      salaryStatus: user.salaryVerificationStatus || (user.monthlySalary ? 'pending' : 'not_submitted'),
      salaryData: user.salaryVerificationStatus === 'verified' ? {
        monthlySalary: user.monthlySalary,
        hourlyRate: user.hourlyRate
      } : undefined,
      monthlyOtHoursRemaining,
      salaryVerificationHistory: [] // TODO: Implement history tracking
    });

  } catch (error) {
    console.error("Error fetching user profile:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}