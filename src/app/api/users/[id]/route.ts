import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import mongoose from 'mongoose';
import { protectApiRoute } from "@/lib/auth-utils";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    // Protect the route - require admin or manager role
    const authResult = await protectApiRoute({ roles: ['admin', 'manager'] });
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    await dbConnect();

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

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    // Protect the route - require admin role for updates
    const authResult = await protectApiRoute({ roles: ['admin'] });
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    await dbConnect();

    // Validate if the provided ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return new NextResponse("Invalid user ID format", { status: 400 });
    }

    const body = await request.json();
    // Only allow updating specific fields for safety
    const { name, department, designation, role, salary, isActive } = body;

    const updateData: Partial<typeof User.prototype> = {};
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

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    // Protect the route - require admin role for deletions
    const authResult = await protectApiRoute({ roles: ['admin'] });
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    await dbConnect();

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