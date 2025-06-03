import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Overtime from "@/models/Overtime";
import AuditLog from "@/models/AuditLog";
import mongoose from 'mongoose';
import { z } from 'zod';
import { protectApiRoute } from "@/lib/auth-utils";

// Define Zod schema for approving/rejecting overtime
const approveOvertimeSchema = z.object({
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

    // Validate overtime ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return new NextResponse("Invalid overtime ID format", { status: 400 });
    }

    const overtime = await Overtime.findById(id);

    if (!overtime) {
      return new NextResponse("Overtime request not found", { status: 404 });
    }

    // Ensure overtime is in 'submitted' status before approval/rejection
    if (overtime.status !== 'submitted') {
        return new NextResponse(`Cannot approve/reject overtime in status: ${overtime.status}`, { status: 400 });
    }

    const body = await request.json();

    // Validate request body using Zod
    const validationResult = approveOvertimeSchema.safeParse(body);

    if (!validationResult.success) {
        return new NextResponse("Invalid request body: " + validationResult.error.message, { status: 400 });
    }

    const validatedData = validationResult.data;

    overtime.status = validatedData.status;
    overtime.approvedBy = authenticatedUser._id;
    overtime.approvedAt = new Date();
    if (validatedData.remarks) {
      overtime.remarks = validatedData.remarks;
    }

    await overtime.save();

    // Log audit entry
    await AuditLog.create({
        userId: authenticatedUser._id,
        action: `${validatedData.status}_overtime`,
        resourceType: 'Overtime',
        resourceId: overtime._id,
        details: validatedData.remarks || `Overtime ${validatedData.status}`,
        target: {
            collection: 'overtime',
            documentId: overtime._id
        }
    });

    return NextResponse.json(overtime);

  } catch (error) {
    console.error("Error approving/rejecting overtime:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}