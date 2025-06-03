import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import RateConfig from "@/models/RateConfig";
import User from "@/models/User";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await dbConnect();

  try {
    // Fetch the authenticated user to check their role
    const authenticatedUser = await User.findOne({ clerkId: userId });

    // Basic role check: Only admin and superadmin can update rate configurations
    if (!authenticatedUser || !authenticatedUser.hasAnyRole(['admin', 'superadmin'])) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const { rate } = body; // Assuming the frontend sends the updated rate value in the body

    // Basic validation
    if (rate === undefined || typeof rate !== 'number') {
        return new NextResponse("Invalid or missing 'rate' in request body", { status: 400 });
    }

    const updatedRateConfig = await RateConfig.findByIdAndUpdate(
      id,
      { rate }, // Update the 'rate' field
      { new: true } // Return the updated document
    );

    if (!updatedRateConfig) {
      return new NextResponse("Rate configuration not found", { status: 404 });
    }

    return NextResponse.json(updatedRateConfig);

  } catch (error) {
    console.error("Error updating rate configuration:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// Optional: Add a GET handler for fetching a single rate by ID if needed in the future
// export async function GET(
//   request: Request,
//   { params }: { params: { id: string } }
// ) {
//   const { userId } = await auth();
//
//   if (!userId) {
//     return new NextResponse("Unauthorized", { status: 401 });
//   }
//
//   await dbConnect();
//
//   try {
//     const authenticatedUser = await User.findOne({ clerkId: userId });
//     if (!authenticatedUser || !authenticatedUser.hasAnyRole(['admin', 'superadmin'])) {
//       return new NextResponse("Forbidden", { status: 403 });
//     }
//
//     const { id } = params;
//     const rateConfig = await RateConfig.findById(id);
//
//     if (!rateConfig) {
//       return new NextResponse("Rate configuration not found", { status: 404 });
//     }
//
//     return NextResponse.json(rateConfig);
//
//   } catch (error) {
//     console.error("Error fetching single rate configuration:", error);
//     return new NextResponse("Internal Server Error", { status: 500 });
//   }
// }