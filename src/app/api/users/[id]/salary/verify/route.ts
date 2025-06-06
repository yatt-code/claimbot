import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/db";
import User from "@/models/User";
import AuditLog from "@/models/AuditLog";
import { SalaryVerificationSchema } from "@/lib/validation/user";
import logger from "@/lib/logger";
import { hasAnyRole } from "@/lib/rbac"; // Assuming this utility exists for role checking

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  const clerkUser = await currentUser();

  if (!userId || !clerkUser) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await dbConnect();

  try {
    const authenticatedUser = await User.findOne({ clerkId: userId });

    if (!authenticatedUser) {
      return NextResponse.json({ error: "Authenticated user not found in database" }, { status: 404 });
    }

    // Check if the authenticated user has the necessary roles to verify salaries
    if (!hasAnyRole(authenticatedUser.roles, ['manager', 'admin', 'superadmin'])) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions to verify salary" }, { status: 403 });
    }

    const targetUserId = params.id;
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    const body = await request.json();
    const validationResult = SalaryVerificationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: "Invalid request body", details: validationResult.error.errors }, { status: 400 });
    }

    const { status, reason } = validationResult.data;

    targetUser.salaryVerificationStatus = status;
    targetUser.salaryVerifiedAt = new Date();
    targetUser.salaryVerifiedBy = authenticatedUser.clerkId; // Store Clerk ID of verifier

    // If rejected, optionally store the reason
    if (status === 'rejected' && reason) {
      // You might want to add a field to the User model to store rejection reasons
      // For now, we'll just log it in the audit trail
    }

    await targetUser.save();

    await AuditLog.create({
      userId: authenticatedUser._id,
      action: `salary_verification_${status}`,
      target: { collection: 'users', documentId: targetUser._id },
      details: `User ${authenticatedUser.email} (${authenticatedUser.clerkId}) ${status} salary for ${targetUser.email} (${targetUser.clerkId}). Reason: ${reason || 'N/A'}`,
    });

    logger.info(`User ${authenticatedUser.email} ${status} salary for ${targetUser.email}.`);
    return NextResponse.json({ message: `Salary for ${targetUser.email} ${status} successfully.` }, { status: 200 });

  } catch (error: unknown) {
    logger.error("Error verifying salary:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: "Internal Server Error", details: errorMessage }, { status: 500 });
  }
}