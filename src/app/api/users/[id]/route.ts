import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import mongoose from 'mongoose';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await dbConnect();

  try {
    // Fetch the authenticated user to check their role
    const authenticatedUser = await User.findOne({ clerkId: userId });

    // Basic role check: Only admin can view other users by ID
    if (!authenticatedUser || authenticatedUser.role !== 'admin') {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { id } = params;

    // Validate if the provided ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return new NextResponse("Invalid user ID format", { status: 400 });
    }

    const user = await User.findById(id);

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    return NextResponse.json(user);

  } catch (error) {
    console.error("Error fetching user:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await dbConnect();

  try {
    // Fetch the authenticated user to check their role
    const authenticatedUser = await User.findOne({ clerkId: userId });

    // Basic role check: Only admin can update users
    if (!authenticatedUser || authenticatedUser.role !== 'admin') {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { id } = params;

    // Validate if the provided ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return new NextResponse("Invalid user ID format", { status: 400 });
    }

    const body = await request.json();
    // Only allow updating specific fields for safety
    const { name, department, designation, role, salary, isActive } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (department !== undefined) updateData.department = department;
    if (designation !== undefined) updateData.designation = designation;
    if (role !== undefined) updateData.role = role;
    if (salary !== undefined) updateData.salary = salary;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Optionally recalculate hourlyRate if salary is updated
    if (salary !== undefined && salary !== null) {
        // Assuming 173 hours/month as per BRS/SDS
        updateData.hourlyRate = salary / 173;
    }


    const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedUser) {
      return new NextResponse("User not found", { status: 404 });
    }

    return NextResponse.json(updatedUser);

  } catch (error) {
    console.error("Error updating user:", error);
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
    // Fetch the authenticated user to check their role
    const authenticatedUser = await User.findOne({ clerkId: userId });

    // Basic role check: Only admin can delete users
    if (!authenticatedUser || authenticatedUser.role !== 'admin') {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { id } = params;

    // Validate if the provided ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return new NextResponse("Invalid user ID format", { status: 400 });
    }

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return new NextResponse("User not found", { status: 404 });
    }

    return NextResponse.json({ message: "User deleted successfully" });

  } catch (error) {
    console.error("Error deleting user:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}