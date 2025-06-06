import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/db";
import User from "@/models/User";
import logger from "@/lib/logger";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await dbConnect();

  try {
    // FIXED: Use direct collection query to avoid Mongoose caching issues
    const authenticatedUser = await User.collection.findOne({ clerkId: userId });

    if (!authenticatedUser) {
      return NextResponse.json({ error: "User not found in database" }, { status: 404 });
    }

    // Calculate review eligibility
    const currentYear = new Date().getFullYear();
    const canReviewSalary = !authenticatedUser.lastSalaryReviewYear || authenticatedUser.lastSalaryReviewYear < currentYear;
    const nextReviewYear = authenticatedUser.lastSalaryReviewYear ? authenticatedUser.lastSalaryReviewYear + 1 : currentYear;

    console.log('DEBUG: Salary status check (FIXED):', {
      userId: authenticatedUser.clerkId,
      status: authenticatedUser.salaryVerificationStatus,
      submittedAt: authenticatedUser.salarySubmittedAt,
      verifiedAt: authenticatedUser.salaryVerifiedAt,
      monthlySalary: authenticatedUser.monthlySalary,
      hourlyRate: authenticatedUser.hourlyRate,
      lastSalaryReviewYear: authenticatedUser.lastSalaryReviewYear,
      canReviewSalary,
      nextReviewYear
    });

    return NextResponse.json({
      status: authenticatedUser.salaryVerificationStatus || 'not_submitted',
      monthlySalary: authenticatedUser.monthlySalary,
      hourlyRate: authenticatedUser.hourlyRate,
      submittedAt: authenticatedUser.salarySubmittedAt,
      verifiedAt: authenticatedUser.salaryVerifiedAt,
      verifiedBy: authenticatedUser.salaryVerifiedBy,
      lastSalaryReviewYear: authenticatedUser.lastSalaryReviewYear,
      canReviewSalary,
      nextReviewYear
    }, { status: 200 });

  } catch (error: unknown) {
    logger.error("Error fetching salary status:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: "Internal Server Error", details: errorMessage }, { status: 500 });
  }
}