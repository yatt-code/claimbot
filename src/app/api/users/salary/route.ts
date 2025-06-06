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
    // Enhanced logging for user lookup
    logger.info(`Starting salary submission for userId: ${userId}`);
    const authenticatedUser = await User.findOne({ clerkId: userId });
    
    if (!authenticatedUser) {
      logger.error(`User not found in database for clerkId: ${userId}`);
      return NextResponse.json({ error: "User not found in database" }, { status: 404 });
    }

    logger.info(`User found - ID: ${authenticatedUser._id}, Email: ${authenticatedUser.email}, Current salary: ${authenticatedUser.monthlySalary}, Current status: ${authenticatedUser.salaryVerificationStatus}`);

    const body = await request.json();
    logger.info(`Request body received:`, body);
    
    const validationResult = SalarySubmissionSchema.safeParse(body);

    if (!validationResult.success) {
      logger.error(`Validation failed:`, validationResult.error.errors);
      return NextResponse.json({ error: "Invalid request body", details: validationResult.error.errors }, { status: 400 });
    }

    const { monthlySalary, hourlyRate } = validationResult.data;
    logger.info(`Validated data - monthlySalary: ${monthlySalary}, hourlyRate: ${hourlyRate}`);

    // FIXED: Use findOneAndUpdate with proper MongoDB update syntax
    // Separate $set and $unset operations to avoid conflicts
    const updateOperation = {
      $set: {
        monthlySalary,
        hourlyRate,
        salaryVerificationStatus: 'pending',
        salarySubmittedAt: new Date()
      },
      $unset: {
        salaryVerifiedAt: "",
        salaryVerifiedBy: ""
      }
    };

    logger.info(`Updating user ${authenticatedUser.email} with operation:`, updateOperation);

    // FINAL FIX: Use direct MongoDB collection update to bypass Mongoose caching issues
    logger.info(`Executing direct MongoDB update for user ${authenticatedUser.email}`);
    
    // Perform the update using MongoDB collection directly
    const updateResult = await User.collection.updateOne(
      { clerkId: userId },
      updateOperation
    );

    if (updateResult.matchedCount === 0) {
      logger.error(`Failed to update user ${authenticatedUser.email} - User not found`);
      return NextResponse.json({ error: "User not found for update" }, { status: 404 });
    }

    if (updateResult.modifiedCount === 0) {
      logger.error(`Failed to update user ${authenticatedUser.email} - No changes made`);
      return NextResponse.json({ error: "Failed to update user data" }, { status: 500 });
    }

    logger.info(`✅ DIRECT UPDATE SUCCESSFUL - matchedCount: ${updateResult.matchedCount}, modifiedCount: ${updateResult.modifiedCount}`);

    // Verify the update using direct collection query (this works correctly)
    const updatedDocument = await User.collection.findOne({ clerkId: userId });
    
    if (!updatedDocument) {
      logger.error(`Failed to retrieve updated user document`);
      return NextResponse.json({ error: "Failed to retrieve updated user" }, { status: 500 });
    }

    logger.info(`✅ FINAL VERIFICATION SUCCESSFUL:`, {
      _id: updatedDocument._id,
      email: updatedDocument.email,
      monthlySalary: updatedDocument.monthlySalary,
      hourlyRate: updatedDocument.hourlyRate,
      salaryVerificationStatus: updatedDocument.salaryVerificationStatus,
      salarySubmittedAt: updatedDocument.salarySubmittedAt
    });

    // Use the updated document for audit log
    const updatedUser = updatedDocument;

    await AuditLog.create({
      userId: updatedUser._id,
      action: 'salary_submission',
      target: { collection: 'users', documentId: updatedUser._id },
      details: `User ${updatedUser.email} submitted salary data for verification.`,
    });

    logger.info(`User ${updatedUser.email} submitted salary data successfully.`);
    return NextResponse.json({ message: "Salary data submitted for verification successfully." }, { status: 200 });

  } catch (error: unknown) {
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