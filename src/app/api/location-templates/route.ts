import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/db";
import LocationTemplate from "@/models/LocationTemplate";
import User from "@/models/User";
import AuditLog from "@/models/AuditLog";
import { validateCoordinates } from "@/lib/google-maps";
import { z } from "zod";

// Validation schema for creating location templates
const CreateLocationTemplateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  address: z.string().min(1, "Address is required").max(500, "Address must be less than 500 characters"),
  lat: z.number().min(-90, "Latitude must be between -90 and 90").max(90, "Latitude must be between -90 and 90"),
  lng: z.number().min(-180, "Longitude must be between -180 and 180").max(180, "Longitude must be between -180 and 180")
});

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await dbConnect();

  try {
    // Fetch the authenticated user to check their role
    const authenticatedUser = await User.findOne({ clerkId: userId });

    // Only admin and superadmin can view location templates
    if (!authenticatedUser || !authenticatedUser.hasAnyRole(['admin', 'superadmin'])) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const locationTemplates = await LocationTemplate.find({}).sort({ name: 1 });
    return NextResponse.json(locationTemplates);

  } catch (error) {
    console.error("Error fetching location templates:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await dbConnect();

  try {
    // Fetch the authenticated user to check their role
    const authenticatedUser = await User.findOne({ clerkId: userId });

    // Only admin and superadmin can create location templates
    if (!authenticatedUser || !authenticatedUser.hasAnyRole(['admin', 'superadmin'])) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await request.json();

    // Validate request body
    const validationResult = CreateLocationTemplateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { name, address, lat, lng } = validationResult.data;

    // Additional coordinate validation
    if (!validateCoordinates(lat, lng)) {
      return new NextResponse("Invalid coordinates", { status: 400 });
    }

    // Check if a location template with the same name already exists
    const existingTemplate = await LocationTemplate.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });
    
    if (existingTemplate) {
      return new NextResponse("Location template with this name already exists", { status: 409 });
    }

    // Create new location template
    const newLocationTemplate = new LocationTemplate({
      name: name.trim(),
      address: address.trim(),
      lat,
      lng
    });

    await newLocationTemplate.save();

    // Log the action
    await AuditLog.create({
      userId: authenticatedUser._id,
      action: 'CREATE_LOCATION_TEMPLATE',
      resourceType: 'LocationTemplate',
      resourceId: newLocationTemplate._id,
      details: {
        name: newLocationTemplate.name,
        address: newLocationTemplate.address,
        coordinates: { lat, lng }
      },
      ipAddress: request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json(newLocationTemplate, { status: 201 });

  } catch (error) {
    console.error("Error creating location template:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}