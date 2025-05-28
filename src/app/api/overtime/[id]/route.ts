import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Overtime from "@/models/Overtime";
import User from "@/models/User";
import AuditLog from "@/models/AuditLog"; // Import AuditLog model
import mongoose from 'mongoose';
import { z } from 'zod';

// Define Zod schema for updating an overtime request
const updateOvertimeSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }).optional(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: "Invalid start time format (HH:MM)",
  }).optional(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: "Invalid end time format (HH:MM)",
  }).optional(),
  reason: z.string().min(1, "Reason is required").optional(),
  // status, approvedBy, approvedAt, remarks are handled by specific endpoints (approve)
});

// Define Zod schema for approving/rejecting an overtime request
const approveOvertimeSchema = z.object({
    status: z.enum(['approved', 'rejected']), // Only allow these status updates via this endpoint
    remarks: z.string().optional(),
});


export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await dbConnect();

  try {
    const authenticatedUser = await User.findOne({ clerkId: userId });

    if (!authenticatedUser) {
      return new NextResponse("User not found in database", { status: 404 });
    }

    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return new NextResponse("Invalid overtime ID format", { status: 400 });
    }

    const overtimeRequest = await Overtime.findById(id).populate('userId', 'name email role'); // Populate user info

    if (!overtimeRequest) {
      return new NextResponse("Overtime request not found", { status: 404 });
    }

    // Authorization check:
    // Staff can only view their own overtime requests
    if (authenticatedUser.role === 'staff' && overtimeRequest.userId._id.toString() !== authenticatedUser._id.toString()) {
        return new NextResponse("Forbidden", { status: 403 });
    }
    // Managers/Finance/Admins can view overtime requests (Managers might need direct report check here)
    // For now, allow Managers/Finance/Admins to view any overtime request
    if (authenticatedUser.role !== 'staff' && authenticatedUser.role !== 'manager' && authenticatedUser.role !== 'finance' && authenticatedUser.role !== 'admin') {
         return new NextResponse("Forbidden", { status: 403 });
    }
    // TODO: Implement manager specific view (direct reports)

    return NextResponse.json(overtimeRequest);

  } catch (error) {
    console.error("Error fetching overtime request:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await dbConnect();

    try {
      const authenticatedUser = await User.findOne({ clerkId: userId });

      if (!authenticatedUser) {
        return new NextResponse("User not found in database", { status: 404 });
      }

      const { id } = params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return new NextResponse("Invalid overtime ID format", { status: 400 });
      }

      const overtimeRequest = await Overtime.findById(id);

      if (!overtimeRequest) {
        return new NextResponse("Overtime request not found", { status: 404 });
      }

      // Authorization check:
      // Staff can only update their own overtime requests if status is 'submitted'
      if (authenticatedUser.role === 'staff') {
          if (overtimeRequest.userId.toString() !== authenticatedUser._id.toString()) {
              return new NextResponse("Forbidden", { status: 403 });
          }
          if (overtimeRequest.status !== 'submitted') {
              return new NextResponse("Cannot update overtime request in status: " + overtimeRequest.status, { status: 400 });
          }
      }
      // Admins/Finance can update overtime requests regardless of status (implement specific field restrictions if needed)
      else if (authenticatedUser.role !== 'admin' && authenticatedUser.role !== 'finance') {
           return new NextResponse("Forbidden", { status: 403 });
      }


      const body = await request.json();

      // Validate request body using Zod
      const validationResult = updateOvertimeSchema.safeParse(body);

      if (!validationResult.success) {
        return new NextResponse("Invalid request body: " + validationResult.error.errors.map(e => e.message).join(', '), { status: 400 });
      }

      const validatedData = validationResult.data;

      // Apply updates
      if (validatedData.date !== undefined) overtimeRequest.date = new Date(validatedData.date);
      if (validatedData.startTime !== undefined) overtimeRequest.startTime = validatedData.startTime;
      if (validatedData.endTime !== undefined) overtimeRequest.endTime = validatedData.endTime;
      if (validatedData.reason !== undefined) overtimeRequest.reason = validatedData.reason;

      // Recalculate hoursWorked if start or end time changed
      if (validatedData.startTime !== undefined || validatedData.endTime !== undefined) {
          const [startHour, startMinute] = (validatedData.startTime || overtimeRequest.startTime).split(':').map(Number);
          const [endHour, endMinute] = (validatedData.endTime || overtimeRequest.endTime).split(':').map(Number);

          let hoursWorked = (endHour + endMinute / 60) - (startHour + startMinute / 60);
          if (hoursWorked < 0) {
              hoursWorked += 24;
          }
          overtimeRequest.hoursWorked = parseFloat(hoursWorked.toFixed(2));
      }


      await overtimeRequest.save();

      // Basic Audit Logging
      // await AuditLog.create({
      //     userId: authenticatedUser._id,
      //     action: 'updated_overtime',
      //     target: { collection: 'overtime', documentId: overtimeRequest._id },
      //     details: `Updated overtime request with ID ${overtimeRequest._id}`,
      // });


      return NextResponse.json(overtimeRequest);

    } catch (error) {
      console.error("Error updating overtime request:", error);
      return new NextResponse("Internal Server Error", { status: 500 });
    }
}


export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await dbConnect();

    try {
      const authenticatedUser = await User.findOne({ clerkId: userId });

      if (!authenticatedUser) {
        return new NextResponse("User not found in database", { status: 404 });
      }

      const { id } = params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return new NextResponse("Invalid overtime ID format", { status: 400 });
      }

      const overtimeRequest = await Overtime.findById(id);

      if (!overtimeRequest) {
        return new NextResponse("Overtime request not found", { status: 404 });
      }

      // Authorization check:
      // Staff can only delete their own overtime requests if status is 'submitted'
      if (authenticatedUser.role === 'staff') {
          if (overtimeRequest.userId.toString() !== authenticatedUser._id.toString()) {
              return new NextResponse("Forbidden", { status: 403 });
          }
          if (overtimeRequest.status !== 'submitted') {
              return new NextResponse("Cannot delete overtime request in status: " + overtimeRequest.status, { status: 400 });
          }
      }
      // Admins can delete overtime requests regardless of status
      else if (authenticatedUser.role !== 'admin') {
           return new NextResponse("Forbidden", { status: 403 });
      }

      const deletedOvertime = await Overtime.findByIdAndDelete(id);

      // Basic Audit Logging
      // await AuditLog.create({
      //     userId: authenticatedUser._id,
      //     action: 'deleted_overtime',
      //     target: { collection: 'overtime', documentId: id },
      //     details: `Deleted overtime request with ID ${id}`,
      // });


      return NextResponse.json({ message: "Overtime request deleted successfully" });

    } catch (error) {
      console.error("Error deleting overtime request:", error);
      return new NextResponse("Internal Server Error", { status: 500 });
    }
}

// Endpoint for approving/rejecting an overtime request
export async function POST_Approve(request: Request, { params }: { params: { id: string } }) {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await dbConnect();

    try {
      const authenticatedUser = await User.findOne({ clerkId: userId });

      if (!authenticatedUser) {
        return new NextResponse("User not found in database", { status: 404 });
      }

      // Authorization check: Only Managers and Finance can approve/reject overtime requests
      if (authenticatedUser.role !== 'manager' && authenticatedUser.role !== 'finance') {
           return new NextResponse("Forbidden", { status: 403 });
      }

      const { id } = params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return new NextResponse("Invalid overtime ID format", { status: 400 });
      }

      const overtimeRequest = await Overtime.findById(id);

      if (!overtimeRequest) {
        return new NextResponse("Overtime request not found", { status: 404 });
      }

      // Ensure overtime request is in 'submitted' status before approval/rejection
      if (overtimeRequest.status !== 'submitted') {
          return new NextResponse("Cannot approve/reject overtime request in status: " + overtimeRequest.status, { status: 400 });
      }

      const body = await request.json();

      // Validate request body using Zod
      const validationResult = approveOvertimeSchema.safeParse(body);

      if (!validationResult.success) {
        return new NextResponse("Invalid request body: " + validationResult.error.errors.map(e => e.message).join(', '), { status: 400 });
      }

      const validatedData = validationResult.data;

      overtimeRequest.status = validatedData.status;
      overtimeRequest.approvedBy = authenticatedUser._id;
      overtimeRequest.approvedAt = new Date();
      overtimeRequest.remarks = validatedData.remarks;

      await overtimeRequest.save();

      // Basic Audit Logging
      // await AuditLog.create({
      //     userId: authenticatedUser._id,
      //     action: `${validatedData.status}_overtime`,
      //     target: { collection: 'overtime', documentId: overtimeRequest._id },
      //     details: `${validatedData.status} overtime request with ID ${overtimeRequest._id}. Remarks: ${validatedData.remarks || 'None'}`,
      // });


      return NextResponse.json(overtimeRequest);

    } catch (error) {
      console.error("Error approving/rejecting overtime request:", error);
      return new NextResponse("Internal Server Error", { status: 500 });
    }
}

// Note: Similar to claims, POST_Approve is used here for clarity but the standard
// App Router convention for a dedicated endpoint would be
// src/app/api/overtime/[id]/approve/route.ts with an exported POST function.