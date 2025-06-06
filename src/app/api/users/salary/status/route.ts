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
    const authenticatedUser = await User.findOne({ clerkId: userId }).select(
      'monthlySalary hourlyRate salaryVerificationStatus salarySubmittedAt salaryVerifiedAt salaryVerifiedBy'
    );

    if (!authenticatedUser) {
      return NextResponse.json({ error: "User not found in database" }, { status: 404 });
    }

    console.log('DEBUG: Salary status check:', {
      userId: authenticatedUser.clerkId,
      status: authenticatedUser.salaryVerificationStatus,
      submittedAt: authenticatedUser.salarySubmittedAt,
      verifiedAt: authenticatedUser.salaryVerifiedAt
    });

    return NextResponse.json({
      status: authenticatedUser.salaryVerificationStatus || 'not_submitted',
      monthlySalary: authenticatedUser.monthlySalary,
      hourlyRate: authenticatedUser.hourlyRate,
      submittedAt: authenticatedUser.salarySubmittedAt,
      verifiedAt: authenticatedUser.salaryVerifiedAt,
      verifiedBy: authenticatedUser.salaryVerifiedBy
    }, { status: 200 });

  } catch (error: unknown) {
    logger.error("Error fetching salary status:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: "Internal Server Error", details: errorMessage }, { status: 500 });
  }
}