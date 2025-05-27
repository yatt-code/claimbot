import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await dbConnect();

  try {
    // Fetch the authenticated user to check their role
    const authenticatedUser = await User.findOne({ clerkId: userId });

    // Basic role check: Only admin can list all users
    if (!authenticatedUser || authenticatedUser.role !== 'admin') {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const users = await User.find({});
    return NextResponse.json(users);

  } catch (error) {
    console.error("Error fetching users:", error);
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

    // Basic role check: Only admin can create users
    if (!authenticatedUser || authenticatedUser.role !== 'admin') {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await request.json();
    const { clerkId, name, email, department, designation, role, salary } = body;

    // Basic validation (more comprehensive validation needed)
    if (!clerkId || !email || !role) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Check if a user with this clerkId or email already exists in our DB
    const existingUser = await User.findOne({ $or: [{ clerkId }, { email }] });
    if (existingUser) {
      return new NextResponse("User with this Clerk ID or email already exists", { status: 409 });
    }

    const newUser = new User({
      clerkId,
      name,
      email,
      department,
      designation,
      role,
      salary,
      // hourlyRate will be calculated based on salary, potentially in a pre-save hook or service
      isActive: true, // Default to active
    });

    await newUser.save();

    return NextResponse.json(newUser, { status: 201 });

  } catch (error) {
    console.error("Error creating user:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}