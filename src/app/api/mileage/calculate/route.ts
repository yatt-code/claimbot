import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/db";
import User from "@/models/User";
import { calculateMileage, validateTripRequirements } from "@/lib/mileage-calculator";
import { z } from "zod";

// Validation schema for mileage calculation request
const CalculateMileageSchema = z.object({
  origin: z.union([
    z.string().min(1, "Origin address is required"),
    z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180)
    })
  ]),
  destination: z.union([
    z.string().min(1, "Destination address is required"),
    z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180)
    })
  ]),
  isRoundTrip: z.boolean()
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
    
    // DEBUG: Log incoming request body
    console.log("🔍 [MILEAGE DEBUG] Incoming request body:", JSON.stringify(body, null, 2));

    // Validate request body
    const validationResult = CalculateMileageSchema.safeParse(body);
    if (!validationResult.success) {
      console.log("❌ [MILEAGE DEBUG] Validation failed:", validationResult.error.errors);
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { origin, destination, isRoundTrip } = validationResult.data;
    
    // DEBUG: Log parsed and validated data
    console.log("✅ [MILEAGE DEBUG] Validated data:", {
      origin: typeof origin === 'string' ? `"${origin}"` : origin,
      destination: typeof destination === 'string' ? `"${destination}"` : destination,
      isRoundTrip
    });

    // Validate trip requirements
    const tripValidation = validateTripRequirements(origin, destination);
    if (!tripValidation.isValid) {
      return NextResponse.json(
        { error: tripValidation.error },
        { status: 400 }
      );
    }

    // DEBUG: Test environment variables
    console.log("🌍 [MILEAGE DEBUG] Environment check:", {
      hasGoogleApiKey: !!process.env.GOOGLE_MAPS_API_KEY,
      apiKeyPrefix: process.env.GOOGLE_MAPS_API_KEY?.substring(0, 10) + "...",
      officeLat: process.env.OFFICE_LAT,
      officeLng: process.env.OFFICE_LNG, // Check for correct spelling
      officeLang: process.env.OFFICE_LANG, // Check for typo
    });

    // Calculate mileage
    console.log("🚗 [MILEAGE DEBUG] Starting mileage calculation...");
    const distanceKm = await calculateMileage(origin, destination, isRoundTrip);
    console.log("✅ [MILEAGE DEBUG] Mileage calculated successfully:", distanceKm, "km");

    // Check for distance warnings (over 100km)
    const hasWarning = distanceKm > 100;
    const warningMessage = hasWarning
      ? `Distance of ${distanceKm}km exceeds 100km. Please verify this is correct.`
      : undefined;

    return NextResponse.json({
      distance: Math.round(distanceKm * 1000), // Convert to meters for frontend compatibility
      distanceKm: Math.round(distanceKm * 100) / 100, // Keep km for clarity
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