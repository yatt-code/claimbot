import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/db";
import Claim from "@/models/Claim";
import User from "@/models/User";
import AuditLog from "@/models/AuditLog"; // Import AuditLog model
import mongoose from 'mongoose';
import { z } from 'zod';

// Define Zod schema for updating a claim
const updateClaimSchema = z.object({
  project: z.string().optional(),
  description: z.string().optional(),
  tripMode: z.enum(['default', 'custom']).optional(),
  roundTrip: z.boolean().optional(),
  origin: z.string().optional(),
  destination: z.string().optional(),
  originLocation: z.object({
    lat: z.number(),
    lng: z.number(),
    formatted_address: z.string(),
  }).optional(),
  destinationLocation: z.object({
    lat: z.number(),
    lng: z.number(),
    formatted_address: z.string(),
  }).optional(),
  calculatedMileage: z.number().optional(),
  expenses: z.object({
    mileage: z.number().optional(),
    toll: z.number().optional(),
    petrol: z.number().optional(),
    meal: z.number().optional(),
    others: z.number().optional(),
  }).optional(),
  status: z.enum(['draft', 'submitted']).optional(), // Allow status updates for draft/submit
  // approvedBy, approvedAt, remarks are handled by specific endpoints (approve)
});

// Define Zod schema for approving/rejecting a claim
const approveClaimSchema = z.object({
    status: z.enum(['approved', 'rejected']), // Only allow these status updates via this endpoint
    remarks: z.string().optional(),
});


export async function GET(request: Request, context: { params: { id: string } }) {
  const { userId } = await auth();

  if (!userId) {
    console.log('API DEBUG: Unauthorized - No Clerk userId in session');
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  try {
    const authenticatedUser = await User.findOne({ clerkId: userId });

    if (!authenticatedUser) {
      console.log('API DEBUG: User not found in database', { sessionClerkId: userId });
      return NextResponse.json({ error: "User not found in database" }, { status: 404 });
    }

    // Await params as per Next.js 15 dynamic route API
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('API DEBUG: Invalid claim ID format', { id });
      return NextResponse.json({ error: "Invalid claim ID format" }, { status: 400 });
    }

    const claim = await Claim.findById(id).populate('userId', 'name email roles'); // Updated to use roles instead of role

    if (!claim) {
      console.log('API DEBUG: Claim not found', { id });
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    // Get the claim owner's user ID (handle both populated and non-populated cases)
    const claimOwnerId = claim.userId._id ? claim.userId._id.toString() : claim.userId.toString();

    // Debug logging for access issues
    console.log('API DEBUG:', {
      sessionClerkId: userId,
      mongoUserId: authenticatedUser._id.toString(),
      mongoUserClerkId: authenticatedUser.clerkId,
      claimUserId: claimOwnerId,
      authenticatedUserRoles: authenticatedUser.roles,
      hasStaffRole: authenticatedUser.roles.includes('staff'),
      isOwner: claimOwnerId === authenticatedUser._id.toString()
    });

    // Authorization check:
    // Staff can only view their own claims
    if (authenticatedUser.roles.includes('staff') && !authenticatedUser.hasAnyRole(['manager', 'finance', 'admin', 'superadmin'])) {
        if (claimOwnerId !== authenticatedUser._id.toString()) {
            console.log('API DEBUG: Forbidden - staff trying to access another user\'s claim', {
              sessionClerkId: userId,
              mongoUserId: authenticatedUser._id.toString(),
              claimUserId: claimOwnerId,
              userRoles: authenticatedUser.roles
            });
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
    }
    // Managers/Finance/Admins can view claims (Managers might need direct report check here)
    // For now, allow Managers/Finance/Admins to view any claim
    else if (!authenticatedUser.hasAnyRole(['manager', 'finance', 'admin', 'superadmin'])) {
         console.log('API DEBUG: Forbidden - role not allowed', { roles: authenticatedUser.roles });
         return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // TODO: Implement manager specific view (direct reports)

    // Calculate totalClaim if not present or if it's 0/null/undefined
    const mileageRate = 0.5; // TODO: fetch from config if available
    if (!claim.totalClaim || claim.totalClaim === 0) {
      const calculatedTotal = ((claim.expenses?.mileage || 0) * mileageRate) +
                             (claim.expenses?.toll || 0) +
                             (claim.expenses?.petrol || 0) +
                             (claim.expenses?.meal || 0) +
                             (claim.expenses?.others || 0);
      
      // Create response with calculated total
      const claimWithTotal = {
        ...claim.toObject(),
        totalClaim: calculatedTotal,
        mileageRate: mileageRate
      };
      return NextResponse.json(claimWithTotal);
    }

    return NextResponse.json(claim);

  } catch (error) {
    console.error("Error fetching claim:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
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

      const { id } = await params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return new NextResponse("Invalid claim ID format", { status: 400 });
      }

      const claim = await Claim.findById(id);

      if (!claim) {
        return new NextResponse("Claim not found", { status: 404 });
      }

      // Authorization check:
      // Staff can only update their own claims if status is 'draft'
      if (authenticatedUser.roles.includes('staff') && !authenticatedUser.hasAnyRole(['manager', 'finance', 'admin', 'superadmin'])) {
          if (claim.userId.toString() !== authenticatedUser._id.toString()) {
              return new NextResponse("Forbidden", { status: 403 });
          }
          if (claim.status !== 'draft') {
              return new NextResponse("Cannot update claim in status: " + claim.status, { status: 400 });
          }
      }
      // Admins/Finance can update claims regardless of status (implement specific field restrictions if needed)
      else if (!authenticatedUser.hasAnyRole(['admin', 'finance', 'superadmin'])) {
           return new NextResponse("Forbidden", { status: 403 });
      }


      const body = await request.json();

      // Validate request body using Zod
      const validationResult = updateClaimSchema.safeParse(body);

      if (!validationResult.success) {
        return new NextResponse("Invalid request body: " + validationResult.error.errors.map(e => e.message).join(', '), { status: 400 });
      }

      const validatedData = validationResult.data;

      // Apply updates
      if (validatedData.project !== undefined) claim.project = validatedData.project;
      if (validatedData.description !== undefined) claim.description = validatedData.description;
      if (validatedData.tripMode !== undefined) claim.tripMode = validatedData.tripMode;
      if (validatedData.roundTrip !== undefined) claim.roundTrip = validatedData.roundTrip;
      if (validatedData.origin !== undefined) claim.origin = validatedData.origin;
      if (validatedData.destination !== undefined) claim.destination = validatedData.destination;
      if (validatedData.originLocation !== undefined) claim.originLocation = validatedData.originLocation;
      if (validatedData.destinationLocation !== undefined) claim.destinationLocation = validatedData.destinationLocation;
      if (validatedData.calculatedMileage !== undefined) claim.calculatedMileage = validatedData.calculatedMileage;
      // Always update expenses if provided, even if some fields are 0 or undefined
      if (validatedData.expenses !== undefined) {
          // Ensure claim.expenses is initialized if it's null or undefined
          if (!claim.expenses) {
              claim.expenses = { mileage: 0, toll: 0, petrol: 0, meal: 0, others: 0 };
          }
          claim.expenses.mileage = validatedData.expenses.mileage ?? 0;
          claim.expenses.toll = validatedData.expenses.toll ?? 0;
          claim.expenses.petrol = validatedData.expenses.petrol ?? 0;
          claim.expenses.meal = validatedData.expenses.meal ?? 0;
          claim.expenses.others = validatedData.expenses.others ?? 0;

          // Recalculate totalClaim after expenses update (mileage at RM0.5/km)
          const mileageRate = 0.5; // TODO: fetch from config if available
          
          // DEBUG: Log calculation details
          console.log("=== BACKEND PATCH CALCULATION DEBUG ===");
          console.log("Received roundTrip flag:", body.roundTrip);
          console.log("Mileage value being saved:", claim.expenses?.mileage || 0);
          console.log("Mileage rate:", mileageRate);
          console.log("Calculated mileage from frontend:", body.calculatedMileage);
          console.log("======================================");
          
          claim.totalClaim = ((claim.expenses?.mileage || 0) * mileageRate) +
                             (claim.expenses?.toll || 0) +
                             (claim.expenses?.petrol || 0) +
                             (claim.expenses?.meal || 0) +
                             (claim.expenses?.others || 0);
                             
          console.log("Final total calculation:", claim.totalClaim);
      }
      // Allow status update (e.g., draft -> submitted)
      if (validatedData.status && validatedData.status !== claim.status) {
        claim.status = validatedData.status;
      }

      await claim.save({ validateBeforeSave: false });

      // Basic Audit Logging
      await AuditLog.create({
          userId: authenticatedUser._id,
          action: 'updated_claim',
          target: { collection: 'claims', documentId: claim._id },
          details: `Updated claim with ID ${claim._id}`,
      });


      return NextResponse.json(claim);

    } catch (error) {
      console.error("Error updating claim:", error);
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
        return new NextResponse("Invalid claim ID format", { status: 400 });
      }

      const claim = await Claim.findById(id);

      if (!claim) {
        return new NextResponse("Claim not found", { status: 404 });
      }

      // Authorization check:
      // Staff can only delete their own claims if status is 'draft'
      if (authenticatedUser.roles.includes('staff') && !authenticatedUser.hasAnyRole(['admin', 'superadmin'])) {
          if (claim.userId.toString() !== authenticatedUser._id.toString()) {
              return new NextResponse("Forbidden", { status: 403 });
          }
          if (claim.status !== 'draft') {
              return new NextResponse("Cannot delete claim in status: " + claim.status, { status: 400 });
          }
      }
      // Admins can delete claims regardless of status
      else if (!authenticatedUser.hasAnyRole(['admin', 'superadmin'])) {
           return new NextResponse("Forbidden", { status: 403 });
      }

      //const deletedClaim = await Claim.findByIdAndDelete(id);

      // Basic Audit Logging
      await AuditLog.create({
          userId: authenticatedUser._id,
          action: 'deleted_claim',
          target: { collection: 'claims', documentId: id },
          details: `Deleted claim with ID ${id}`,
      });


      return NextResponse.json({ message: "Claim deleted successfully" });

    } catch (error) {
      console.error("Error deleting claim:", error);
      return new NextResponse("Internal Server Error", { status: 500 });
    }
}

// Endpoint for submitting a claim
export async function POST_Submit(request: Request, { params }: { params: { id: string } }) {
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
        return new NextResponse("Invalid claim ID format", { status: 400 });
      }

      const claim = await Claim.findById(id);

      if (!claim) {
        return new NextResponse("Claim not found", { status: 404 });
      }

      // Authorization check: Staff can only submit their own claims if status is 'draft'
      if (authenticatedUser.roles.includes('staff') && !authenticatedUser.hasAnyRole(['manager', 'finance', 'admin', 'superadmin'])) {
          if (claim.userId.toString() !== authenticatedUser._id.toString()) {
              return new NextResponse("Forbidden", { status: 403 });
          }
          if (claim.status !== 'draft') {
              return new NextResponse("Cannot submit claim in status: " + claim.status, { status: 400 });
          }
      } else {
           return new NextResponse("Forbidden", { status: 403 });
      }

      claim.status = 'submitted';
      claim.submittedAt = new Date();
      await claim.save();

      // Basic Audit Logging
      await AuditLog.create({
          userId: authenticatedUser._id,
          action: 'submitted_claim',
          target: { collection: 'claims', documentId: claim._id },
          details: `Submitted claim with ID ${claim._id}`,
      });


      return NextResponse.json(claim);

    } catch (error) {
      console.error("Error submitting claim:", error);
      return new NextResponse("Internal Server Error", { status: 500 });
    }
}

// Endpoint for approving/rejecting a claim
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

      // Authorization check: Only Managers and Finance can approve/reject claims
      if (!authenticatedUser.hasAnyRole(['manager', 'finance', 'admin', 'superadmin'])) {
           return new NextResponse("Forbidden", { status: 403 });
      }

      const { id } = params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return new NextResponse("Invalid claim ID format", { status: 400 });
      }

      const claim = await Claim.findById(id);

      if (!claim) {
        return new NextResponse("Claim not found", { status: 404 });
      }

      // Ensure claim is in 'submitted' status before approval/rejection
      if (claim.status !== 'submitted') {
          return new NextResponse("Cannot approve/reject claim in status: " + claim.status, { status: 400 });
      }

      const body = await request.json();

      // Validate request body using Zod
      const validationResult = approveClaimSchema.safeParse(body);

      if (!validationResult.success) {
        return new NextResponse("Invalid request body: " + validationResult.error.errors.map(e => e.message).join(', '), { status: 400 });
      }

      const validatedData = validationResult.data;

      claim.status = validatedData.status;
      claim.approvedBy = authenticatedUser._id;
      claim.approvedAt = new Date();
      claim.remarks = validatedData.remarks;

      await claim.save();

      // Basic Audit Logging
      await AuditLog.create({
          userId: authenticatedUser._id,
          action: `${validatedData.status}_claim`,
          target: { collection: 'claims', documentId: claim._id },
          details: `${validatedData.status} claim with ID ${claim._id}. Remarks: ${validatedData.remarks || 'None'}`,
      });


      return NextResponse.json(claim);

    } catch (error) {
      console.error("Error approving/rejecting claim:", error);
      return new NextResponse("Internal Server Error", { status: 500 });
    }
}

// Note: Next.js App Router handles different HTTP methods (GET, POST, PATCH, DELETE)
// as separate exported functions. For custom actions like 'submit' or 'approve',
// we can use a dynamic route segment like `[action]` and handle different actions
// within a single POST handler, or use dedicated routes like `/api/claims/[id]/submit`
// and `/api/claims/[id]/approve`. The latter is used here for clarity.
// The function names POST_Submit and POST_Approve are illustrative; Next.js expects
// standard HTTP method names (GET, POST, etc.). To handle these as separate endpoints
// under the same dynamic segment, you would typically create subdirectories like
// `src/app/api/claims/[id]/submit/route.ts` and `src/app/api/claims/[id]/approve/route.ts`.
// The current implementation with POST_Submit and POST_Approve in the same file
// is not the standard App Router convention for separate endpoints.
// A better approach for submit/approve would be:
// src/app/api/claims/[id]/submit/route.ts -> export async function POST() { ... submit logic ... }
// src/app/api/claims/[id]/approve/route.ts -> export async function POST() { ... approve logic ... }
// For this phase, I will proceed with the current file structure and note the convention.