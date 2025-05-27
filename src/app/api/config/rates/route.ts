import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import RateConfig from "@/models/RateConfig";
import User from "@/models/User";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await dbConnect();

  try {
    // Fetch the authenticated user to check their role
    const authenticatedUser = await User.findOne({ clerkId: userId }); // Assuming User model is imported

    // Basic role check: Only admin can view rate configurations
    if (!authenticatedUser || authenticatedUser.role !== 'admin') {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const rates = await RateConfig.find({});
    return NextResponse.json(rates);

  } catch (error) {
    console.error("Error fetching rate configurations:", error);
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
    const authenticatedUser = await User.findOne({ clerkId: userId }); // Assuming User model is imported

    // Basic role check: Only admin can create/update rate configurations
    if (!authenticatedUser || authenticatedUser.role !== 'admin') {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await request.json();
    const { type, value, condition, multiplier, effectiveDate } = body;

    // Basic validation
    if (!type || !effectiveDate) {
        return new NextResponse("Missing required fields: type and effectiveDate", { status: 400 });
    }

    // More specific validation based on type
    if (type === 'mileage' && value === undefined) {
        return new NextResponse("Missing required field: value for mileage type", { status: 400 });
    }

    if (type === 'overtime_multiplier' && (multiplier === undefined || !condition || !condition.dayType || !condition.designation)) {
         return new NextResponse("Missing required fields: multiplier, condition.dayType, and condition.designation for overtime_multiplier type", { status: 400 });
    }


    // Check if a rate config with the same type and effective date already exists (optional, depending on desired behavior)
    // const existingRate = await RateConfig.findOne({ type, effectiveDate });
    // if (existingRate) {
    //     return new NextResponse("Rate configuration for this type and effective date already exists", { status: 409 });
    // }

    const newRateConfig = new RateConfig({
      type,
      value,
      condition,
      multiplier,
      effectiveDate: new Date(effectiveDate), // Ensure effectiveDate is a Date object
    });

    await newRateConfig.save();

    return NextResponse.json(newRateConfig, { status: 201 });

  } catch (error) {
    console.error("Error creating rate configuration:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}