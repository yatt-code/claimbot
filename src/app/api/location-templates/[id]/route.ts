import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/db";
import LocationTemplate from "@/models/LocationTemplate";
import User from "@/models/User";
import AuditLog from "@/models/AuditLog";
import { validateCoordinates } from "@/lib/google-maps";
import { z } from "zod";
import mongoose from "mongoose";

// Validation schema for updating location templates
const UpdateLocationTemplateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters").optional(),
  address: z.string().min(1, "Address is required").max(500, "Address must be less than 500 characters").optional(),
  lat: z.number().min(-90, "Latitude must be between -90 and 90").max(90, "Latitude must be between -90 and 90").optional(),
  lng: z.number().min(-180, "Longitude must be between -180 and 180").max(180, "Longitude must be between -180 and 180").optional()
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = params;

  // Validate MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return new NextResponse("Invalid location template ID", { status: 400 });
  }

  await dbConnect();

  try {
    // Fetch the authenticated user to check their role
    const authenticatedUser = await User.findOne({ clerkId: userId });

    // Only admin and superadmin can update location templates
    if (!authenticatedUser || !authenticatedUser.hasAnyRole(['admin', 'superadmin'])) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await request.json();

    // Validate request body
    const validationResult = UpdateLocationTemplateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // Additional coordinate validation if coordinates are being updated
    if ((updateData.lat !== undefined || updateData.lng !== undefined)) {
      const existingTemplate = await LocationTemplate.findById(id);
      if (!existingTemplate) {
        return new NextResponse("Location template not found", { status: 404 });
      }

      const newLat = updateData.lat !== undefined ? updateData.lat : existingTemplate.lat;
      const newLng = updateData.lng !== undefined ? updateData.lng : existingTemplate.lng;

      if (!validateCoordinates(newLat, newLng)) {
        return new NextResponse("Invalid coordinates", { status: 400 });
      }
    }

    // Check if name is being updated and if it conflicts with existing templates
    if (updateData.name) {
      const existingTemplate = await LocationTemplate.findOne({ 
        name: { $regex: new RegExp(`^${updateData.name}$`, 'i') },
        _id: { $ne: id }
      });
      
      if (existingTemplate) {
        return new NextResponse("Location template with this name already exists", { status: 409 });
      }
    }

    // Trim string fields
    if (updateData.name) updateData.name = updateData.name.trim();
    if (updateData.address) updateData.address = updateData.address.trim();

    // Find and update the location template
    const updatedTemplate = await LocationTemplate.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedTemplate) {
      return new NextResponse("Location template not found", { status: 404 });
    }

    // Log the action
    await AuditLog.create({
      userId: authenticatedUser._id,
      action: 'UPDATE_LOCATION_TEMPLATE',
      resourceType: 'LocationTemplate',
      resourceId: updatedTemplate._id,
      details: {
        updatedFields: updateData,
        name: updatedTemplate.name
      },
      ipAddress: request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json(updatedTemplate);

  } catch (error) {
    console.error("Error updating location template:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = params;

  // Validate MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return new NextResponse("Invalid location template ID", { status: 400 });
  }

  await dbConnect();

  try {
    // Fetch the authenticated user to check their role
    const authenticatedUser = await User.findOne({ clerkId: userId });

    // Only admin and superadmin can delete location templates
    if (!authenticatedUser || !authenticatedUser.hasAnyRole(['admin', 'superadmin'])) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Find the location template before deletion for audit logging
    const templateToDelete = await LocationTemplate.findById(id);
    
    if (!templateToDelete) {
      return new NextResponse("Location template not found", { status: 404 });
    }

    // Delete the location template
    await LocationTemplate.findByIdAndDelete(id);

    // Log the action
    await AuditLog.create({
      userId: authenticatedUser._id,
      action: 'DELETE_LOCATION_TEMPLATE',
      resourceType: 'LocationTemplate',
      resourceId: templateToDelete._id,
      details: {
        name: templateToDelete.name,
        address: templateToDelete.address,
        coordinates: { 
          lat: templateToDelete.lat, 
          lng: templateToDelete.lng 
        }
      },
      ipAddress: request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    return new NextResponse(null, { status: 204 });

  } catch (error) {
    console.error("Error deleting location template:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}