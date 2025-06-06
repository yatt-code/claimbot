import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/db";
import Overtime from "@/models/Overtime";
import User from "@/models/User";
import AuditLog from "@/models/AuditLog"; // Import AuditLog model
import RateConfig from "@/models/RateConfig"; // Import RateConfig model
import { z } from 'zod';

// Helper to check if a date is a weekday (Monday-Friday)
const isWeekday = (date: Date) => {
  const day = date.getDay();
  return day >= 1 && day <= 5; // Monday is 1, Friday is 5
};

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
}).refine((data) => {
  const requestDate = new Date(data.date);
  const [startHour] = data.startTime.split(':').map(Number);

  console.log('DEBUG: Backend overtime validation:', {
    date: data.date,
    startTime: data.startTime,
    isWeekday: isWeekday(requestDate),
    startHour
  });

  // Weekday time validation: only after 8 PM (20:00)
  if (isWeekday(requestDate)) {
    if (startHour < 20) {
      console.log('DEBUG: Overtime rejected - weekday before 8 PM');
      return false; // Overtime on weekday must start after 8 PM
    }
  }
  return true;
}, {
  message: "Overtime on weekdays can only be submitted for hours after 8 PM.",
  path: ["startTime"],
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

    // Salary verification check
    if (authenticatedUser.salaryVerificationStatus !== 'verified') {
      return NextResponse.json({ error: "Forbidden: Salary not verified. Please submit your salary for verification." }, { status: 403 });
    }

    const body = await request.json();
    
    console.log('DEBUG: Overtime submission request body:', body);

    // Map justification to reason for backend validation
    const mappedBody = {
      ...body,
      reason: body.justification || body.reason
    };

    // Validate request body using Zod
    const validationResult = createOvertimeSchema.safeParse(mappedBody);

    if (!validationResult.success) {
      console.log('DEBUG: Overtime validation failed:', validationResult.error.errors);
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



    // Calculate total payout and update monthly overtime hours
    const currentMonth = new Date(validatedData.date).toISOString().substring(0, 7); // YYYY-MM
    const existingMonthlyHours = authenticatedUser.monthlyOvertimeHours?.get(currentMonth) || 0;

    // Monthly OT hours cap validation (18 hours)
    const totalHoursForMonth = existingMonthlyHours + hoursWorked;
    if (totalHoursForMonth > 18) {
      return NextResponse.json({ error: "Monthly overtime hours cap (18 hours) exceeded." }, { status: 400 });
    }

    // Determine day type for rate calculation
    const requestDate = new Date(validatedData.date);
    const dayType = isWeekday(requestDate) ? 'weekday' : 'weekend'; // Simplified, public holidays would need a separate check

    // Fetch overtime multiplier from RateConfig
    const rateConfig = await RateConfig.findOne({
      type: 'overtime_multiplier',
      'condition.dayType': dayType,
      'condition.designation': authenticatedUser.designation, // Use user's designation
      effectiveDate: { $lte: new Date() } // Get the most recent applicable rate
    }).sort({ effectiveDate: -1 });

    const rateMultiplier = rateConfig?.multiplier || 1.5; // Default to 1.5 if no specific config found

    // Calculate hourly rate for overtime
    let userHourlyRate = authenticatedUser.hourlyRate;
    if (!userHourlyRate && authenticatedUser.monthlySalary) {
      // Assuming 160 working hours per month for salary conversion
      userHourlyRate = authenticatedUser.monthlySalary / 160;
    }

    if (!userHourlyRate) {
      return NextResponse.json({ error: "Hourly rate or monthly salary not found for user. Please update your profile." }, { status: 400 });
    }

    const totalPayout = hoursWorked * userHourlyRate * rateMultiplier;

    const newOvertime = new Overtime({
      userId: authenticatedUser._id,
      date: new Date(validatedData.date),
      startTime: validatedData.startTime,
      endTime: validatedData.endTime,
      reason: validatedData.reason,
      hoursWorked: hoursWorked,
      rateMultiplier: rateMultiplier,
      hourlyRate: userHourlyRate,
      totalPayout: totalPayout,
      attachments: [],
      status: 'submitted', // Default status
    });

    await newOvertime.save();

    // Update monthly overtime tracking in User model
    authenticatedUser.monthlyOvertimeHours?.set(currentMonth, totalHoursForMonth);
    await authenticatedUser.save();

    // Basic Audit Logging
    await AuditLog.create({
        userId: authenticatedUser._id,
        action: 'created_overtime',
        target: { collection: 'overtime', documentId: newOvertime._id },
        details: `Created overtime request with ID ${newOvertime._id} for ${hoursWorked} hours.`,
    });


    return NextResponse.json(newOvertime, { status: 201 });

  } catch (error: unknown) { // Changed to unknown
    console.error("Error creating overtime request:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: "Internal Server Error", details: errorMessage }, { status: 500 });
  }
}