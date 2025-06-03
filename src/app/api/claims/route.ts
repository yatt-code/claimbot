import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Claim from "@/models/Claim";
import User from "@/models/User"; // Assuming User model is needed for role check
import AuditLog from "@/models/AuditLog"; // Import AuditLog model
import { z } from 'zod'; // Import Zod

// Define Zod schema for creating a claim
const createClaimSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  project: z.string().optional(),
  description: z.string().optional(),
  expenses: z.object({
    mileage: z.number().optional(),
    toll: z.number().optional(),
    petrol: z.number().optional(),
    meal: z.number().optional(),
    others: z.number().optional(),
  }).optional(),
  // attachments will be handled separately via file upload endpoint
  // status will default to 'draft' on creation
  // userId will be derived from authenticated user
});

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await dbConnect();

  try {
    // Fetch the authenticated user to determine their role and associated MongoDB user ID
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

    let claims;
    // Staff can only see their own claims
    if (authenticatedUser.roles.includes('staff') && !authenticatedUser.hasAnyRole(['manager', 'finance', 'admin', 'superadmin'])) {
      claims = await Claim.find({ userId: authenticatedUser._id });
    }
    // Admins and Finance can see all claims
    else if (authenticatedUser.hasAnyRole(['admin', 'finance', 'superadmin'])) {
      claims = await Claim.find({});
    }
    // Managers might see direct reports' claims (more complex logic needed here)
    else if (authenticatedUser.hasRole('manager')) {
        // For now, managers see no claims until direct report logic is implemented
        claims = []; // Or implement logic to find claims by users they manage
    }
    else {
        // Other roles see no claims
        claims = [];
    }

    // Calculate totalClaim for claims that don't have it or need recalculation
    const mileageRate = 0.5; // TODO: fetch from config if available
    const claimsWithCalculatedTotal = claims.map(claim => {
      // Calculate total if not present or if it's 0/null/undefined
      if (!claim.totalClaim || claim.totalClaim === 0) {
        const calculatedTotal = ((claim.expenses?.mileage || 0) * mileageRate) +
                               (claim.expenses?.toll || 0) +
                               (claim.expenses?.petrol || 0) +
                               (claim.expenses?.meal || 0) +
                               (claim.expenses?.others || 0);
        
        // Create a plain object with calculated total
        return {
          ...claim.toObject(),
          totalClaim: calculatedTotal,
          mileageRate: mileageRate
        };
      }
      return claim.toObject();
    });

    return NextResponse.json(claimsWithCalculatedTotal);

  } catch (error) {
    console.error("Error fetching claims:", error);
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
    // Fetch the authenticated user to get their MongoDB user ID
    const authenticatedUser = await User.findOne({ clerkId: userId });

    if (!authenticatedUser) {
      return NextResponse.json({ error: "User not found in database" }, { status: 404 });
    }

    // Only Staff can create claims
    if (!authenticatedUser.roles.includes('staff')) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Validate request body using Zod
    const validationResult = createClaimSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: "Invalid request body", details: validationResult.error.errors.map(e => e.message) }, { status: 400 });
    }

    // Merge status from request body if present
    const validatedData = { ...validationResult.data, status: body.status };

    // Calculate totalClaim (mileage at RM0.5/km unless configured differently)
    const mileageRate = 0.5; // TODO: fetch from config if available
    const totalClaim = ((validatedData.expenses?.mileage || 0) * mileageRate) +
                       (validatedData.expenses?.toll || 0) +
                       (validatedData.expenses?.petrol || 0) +
                       (validatedData.expenses?.meal || 0) +
                       (validatedData.expenses?.others || 0);


    const newClaim = new Claim({
      userId: authenticatedUser._id, // Link claim to the authenticated user
      date: new Date(validatedData.date),
      project: validatedData.project,
      description: validatedData.description,
      expenses: validatedData.expenses,
      // mileageRate will be fetched from config later
      totalClaim: totalClaim,
      attachments: [], // Attachments linked via file upload endpoint
      status: validatedData.status ?? 'draft', // Use provided status or default to draft
    });

    await newClaim.save();

    // Basic Audit Logging
    await AuditLog.create({
        userId: authenticatedUser._id,
        action: 'created_claim',
        target: { collection: 'claims', documentId: newClaim._id },
        details: `Created claim with ID ${newClaim._id}`,
    });


    return NextResponse.json(newClaim, { status: 201 });

  } catch (error: unknown) {
    console.error("Error creating claim:", error);
    // Return a JSON error response for better frontend handling
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({
      success: false,
      error: "Internal Server Error",
      details: errorMessage // Include error message for debugging
    }, { status: 500 });
  }
}