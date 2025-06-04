import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/db";
import User from "@/models/User";
import { calculateMileage, validateTripModeRequirements } from "@/lib/mileage-calculator";
import { TripMode } from "@/types/location";
import { z } from "zod";

// Validation schema for mileage calculation request
const CalculateMileageSchema = z.object({
  tripMode: z.nativeEnum(TripMode, { errorMap: () => ({ message: "Invalid trip mode" }) }),
  destination: z.union([
    z.string().min(1, "Destination address is required"),
    z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180)
    })
  ]),
  origin: z.union([
    z.string().min(1),
    z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180)
    })
  ]).optional()
});

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await dbConnect();

  try {
    // Fetch the authenticated user
    const authenticatedUser = await User.findOne({ clerkId: userId });

    if (!authenticatedUser) {
      return new NextResponse("User not found", { status: 404 });
    }

    const body = await request.json();

    // Validate request body
    const validationResult = CalculateMileageSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { tripMode, destination, origin } = validationResult.data;

    // Validate trip mode requirements
    const tripValidation = validateTripModeRequirements(tripMode, destination, origin);
    if (!tripValidation.isValid) {
      return NextResponse.json(
        { error: tripValidation.error },
        { status: 400 }
      );
    }

    // Calculate mileage
    const distanceKm = await calculateMileage(tripMode, destination, origin);

    // Check for distance warnings (over 100km)
    const hasWarning = distanceKm > 100;
    const warningMessage = hasWarning 
      ? `Distance of ${distanceKm}km exceeds 100km. Please verify this is correct.`
      : undefined;

    return NextResponse.json({
      tripMode,
      distanceKm: Math.round(distanceKm * 100) / 100, // Round to 2 decimal places
      hasWarning,
      warningMessage,
      calculatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error calculating mileage:", error);
    
    // Return more specific error messages for common issues
    if (error instanceof Error) {
      if (error.message.includes('Google Maps')) {
        return NextResponse.json(
          { error: "Unable to calculate distance. Please check the addresses and try again." },
          { status: 422 }
        );
      }
      
      if (error.message.includes('Office location')) {
        return NextResponse.json(
          { error: "Office location is not configured. Please contact your administrator." },
          { status: 503 }
        );
      }
    }

    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// GET endpoint to retrieve office location for frontend use
export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await dbConnect();

  try {
    // Fetch the authenticated user
    const authenticatedUser = await User.findOne({ clerkId: userId });

    if (!authenticatedUser) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Import here to avoid issues with environment variables during module loading
    const { getOfficeLocation } = await import("@/lib/google-maps");
    
    try {
      const officeLocation = getOfficeLocation();
      return NextResponse.json({
        office: officeLocation,
        available: true
      });
    } catch (error) {
      return NextResponse.json({
        office: null,
        available: false,
        error: error instanceof Error ? error.message : "Office location not configured"
      });
    }

  } catch (error) {
    console.error("Error fetching office location:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}