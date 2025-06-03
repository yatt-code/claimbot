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
    const user = await User.findOne({ clerkId: userId });

    if (!user) {
      // If user exists in Clerk but not in our DB,
      // we might want to create a basic user record here
      // or handle this during a webhook event.
      // For now, return not found or a basic response.
      return new NextResponse("User not found in database", { status: 404 });
    }

    // Return user profile data, excluding sensitive info like salary if not admin
    // This is a simplified example; role-based data filtering would be needed
    return NextResponse.json({
      _id: user._id,
      clerkId: user.clerkId,
      name: user.name,
      email: user.email,
      department: user.department,
      designation: user.designation,
      roles: user.roles,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      // Include salary/hourlyRate only for authorized roles (e.g., admin, finance)
      // salary: user.salary,
      // hourlyRate: user.hourlyRate,
    });

  } catch (error) {
    console.error("Error fetching user profile:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}