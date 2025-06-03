import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Overtime from "@/models/Overtime";
import User from "@/models/User";
// import AuditLog from "@/models/AuditLog"; // Import AuditLog model
import { z } from 'zod';

// Define Zod schema for creating an overtime request
const createOvertimeSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: "Invalid start time format (HH:MM)",
  }),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: "Invalid end time format (HH:MM)",
  }),
  reason: z.string().min(1, "Reason is required"),
  // attachments will be handled separately
  // status will default to 'submitted'
  // userId will be derived from authenticated user
});


export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await dbConnect();

  try {
    let authenticatedUser = await User.findOne({ clerkId: userId });

    if (!authenticatedUser) {
      // Auto-create user if they don't exist in MongoDB but are authenticated with Clerk
      // This handles the case for new users who haven't been manually created yet
      try {
        authenticatedUser = await User.create({
          clerkId: userId,
          name: "New User", // Will be updated when they complete their profile
          email: "user@example.com", // Will be updated when they complete their profile
          department: "General",
          designation: "Staff",
          roles: ["staff"], // Default roles array
          isActive: true,
          salary: 0,
          hourlyRate: 0,
        });
      } catch (createError: unknown) {
        // If user already exists (race condition), try to find them again
        if (createError && typeof createError === 'object' && 'code' in createError && createError.code === 11000) {
          authenticatedUser = await User.findOne({ clerkId: userId });
          if (!authenticatedUser) {
            return NextResponse.json({ error: "User creation failed" }, { status: 500 });
          }
        } else {
          throw createError;
        }
      }
    }

    // All users (including superadmin) can only see their own overtime requests when accessing via /dashboard or /my-submissions
    // Admin functions for viewing all requests should be accessed via /admin routes
    const overtimeRequests = await Overtime.find({ userId: authenticatedUser._id });


    return NextResponse.json(overtimeRequests);

  } catch (error) {
    console.error("Error fetching overtime requests:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await dbConnect();

  try {
    const authenticatedUser = await User.findOne({ clerkId: userId });

    if (!authenticatedUser) {
      return NextResponse.json({ error: "User not found in database" }, { status: 404 });
    }

    // Staff, managers, admin, and superadmin can create overtime requests
    if (!authenticatedUser.hasAnyRole(['staff', 'manager', 'admin', 'superadmin'])) {
        return NextResponse.json({ error: "Forbidden: Only staff, managers, and admins can submit overtime requests" }, { status: 403 });
    }

    const body = await request.json();

    // Validate request body using Zod
    const validationResult = createOvertimeSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: "Invalid request body", details: validationResult.error.errors.map(e => e.message) }, { status: 400 });
    }

    const validatedData = validationResult.data;

    // Calculate hoursWorked (simplified - does not handle overnight or complex scenarios)
    const [startHour, startMinute] = validatedData.startTime.split(':').map(Number);
    const [endHour, endMinute] = validatedData.endTime.split(':').map(Number);

    let hoursWorked = (endHour + endMinute / 60) - (startHour + startMinute / 60);
    if (hoursWorked < 0) {
        // Handle overnight case (assuming overtime doesn't span more than 24 hours)
        hoursWorked += 24;
    }
    // Round to two decimal places
    hoursWorked = parseFloat(hoursWorked.toFixed(2));


    const newOvertime = new Overtime({
      userId: authenticatedUser._id,
      date: new Date(validatedData.date),
      startTime: validatedData.startTime,
      endTime: validatedData.endTime,
      reason: validatedData.reason,
      hoursWorked: hoursWorked,
      // rateMultiplier and hourlyRate will be calculated/fetched later
      // totalPayout will be calculated later
      attachments: [],
      status: 'submitted', // Default status
    });

    await newOvertime.save();

    // Basic Audit Logging
    // await AuditLog.create({
    //     userId: authenticatedUser._id,
    //     action: 'created_overtime',
    //     target: { collection: 'overtime', documentId: newOvertime._id },
    //     details: `Created overtime request with ID ${newOvertime._id}`,
    // });


    return NextResponse.json(newOvertime, { status: 201 });

  } catch (error) {
    console.error("Error creating overtime request:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}