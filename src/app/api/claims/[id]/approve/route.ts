import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/db";
import User from "@/models/User";
import Claim from "@/models/Claim";
import AuditLog from "@/models/AuditLog";
import mongoose from 'mongoose';
import { z } from 'zod';
import { protectApiRoute } from "@/lib/auth-utils";

// Define Zod schema for approving/rejecting a claim
const approveClaimSchema = z.object({
    status: z.enum(['approved', 'rejected']), // Only allow these status updates via this endpoint
    remarks: z.string().optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    // Protect the route - require manager, finance, or admin role
    const authResult = await protectApiRoute({ roles: ['manager', 'finance', 'admin'] });
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    await dbConnect();

    // Get the authenticated user from database
    const { userId } = await auth();
    const authenticatedUser = await User.findOne({ clerkId: userId });

    if (!authenticatedUser) {
      return new NextResponse("User not found in database", { status: 404 });
    }

    // Validate claim ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return new NextResponse("Invalid claim ID format", { status: 400 });
    }

    const claim = await Claim.findById(id);

    if (!claim) {
      return new NextResponse("Claim not found", { status: 404 });
    }

    // Ensure claim is in 'submitted' status before approval/rejection
    if (claim.status !== 'submitted') {
        return new NextResponse(`Cannot approve/reject claim in status: ${claim.status}`, { status: 400 });
    }

    const body = await request.json();

    // Validate request body using Zod
    const validationResult = approveClaimSchema.safeParse(body);

    if (!validationResult.success) {
        return new NextResponse("Invalid request body: " + validationResult.error.message, { status: 400 });
    }

    const validatedData = validationResult.data;

    claim.status = validatedData.status;
    claim.approvedBy = authenticatedUser._id;
    claim.approvedAt = new Date();
    if (validatedData.remarks) {
      claim.remarks = validatedData.remarks;
    }

    await claim.save();

    // Log audit entry
    await AuditLog.create({
        userId: authenticatedUser._id,
        action: `${validatedData.status}_claim`,
        resourceType: 'Claim',
        resourceId: claim._id,
        details: validatedData.remarks || `Claim ${validatedData.status}`,
        target: {
            collection: 'claims',
            documentId: claim._id
        }
    });

    return NextResponse.json(claim);

  } catch (error) {
    console.error("Error approving/rejecting claim:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}