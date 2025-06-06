import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/db";
import User from "@/models/User";
import AuditLog from "@/models/AuditLog";
import { SalarySubmissionSchema } from "@/lib/validation/user";
import logger from "@/lib/logger"; // Corrected import

export async function POST(request: Request) {
  const { userId } = await auth(); // Await auth()

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await dbConnect();

  try {
    const authenticatedUser = await User.findOne({ clerkId: userId });

    if (!authenticatedUser) {
      return NextResponse.json({ error: "User not found in database" }, { status: 404 });
    }

    const body = await request.json();
    const validationResult = SalarySubmissionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: "Invalid request body", details: validationResult.error.errors }, { status: 400 });
    }

    const { monthlySalary, hourlyRate } = validationResult.data;

    authenticatedUser.monthlySalary = monthlySalary;
    authenticatedUser.hourlyRate = hourlyRate;
    authenticatedUser.salaryVerificationStatus = 'pending';
    authenticatedUser.salarySubmittedAt = new Date();
    authenticatedUser.salaryVerifiedAt = undefined; // Reset verification date
    authenticatedUser.salaryVerifiedBy = undefined; // Reset verifier

    await authenticatedUser.save();

    await AuditLog.create({
      userId: authenticatedUser._id,
      action: 'salary_submission',
      target: { collection: 'users', documentId: authenticatedUser._id },
      details: `User ${authenticatedUser.email} submitted salary data for verification.`,
    });

    logger.info(`User ${authenticatedUser.email} submitted salary data.`);
    return NextResponse.json({ message: "Salary data submitted for verification successfully." }, { status: 200 });

  } catch (error: unknown) { // Changed to unknown
    logger.error("Error submitting salary data:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: "Internal Server Error", details: errorMessage }, { status: 500 });
  }
}

export async function GET() {
  const { userId } = await auth(); // Await auth()

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await dbConnect();

  try {
    const authenticatedUser = await User.findOne({ clerkId: userId }).select('monthlySalary hourlyRate salaryVerificationStatus salarySubmittedAt salaryVerifiedAt salaryVerifiedBy');

    if (!authenticatedUser) {
      return NextResponse.json({ error: "User not found in database" }, { status: 404 });
    }

    return NextResponse.json(authenticatedUser, { status: 200 });

  } catch (error: unknown) { // Changed to unknown
    logger.error("Error fetching salary status:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: "Internal Server Error", details: errorMessage }, { status: 500 });
  }
}