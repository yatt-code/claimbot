import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/db";
import User from "@/models/User";
import { protectApiRoute } from "@/lib/auth-utils";
import { z } from "zod";

// Input validation schema
const createUserSchema = z.object({
  clerkId: z.string().min(1, "Clerk ID is required"),
  name: z.string().optional(),
  email: z.string().email("Valid email is required"),
  department: z.string().optional(),
  designation: z.string().optional(),
  roles: z.array(z.enum(['staff', 'manager', 'finance', 'admin', 'superadmin'])).default(['staff']),
  salary: z.number().positive().optional(),
});

export async function GET() {
  try {
    // Protect route - require admin permissions
    await protectApiRoute({ 
      permissions: ['users:read:all'],
      roles: ['admin', 'superadmin'] 
    });

    await dbConnect();

    const users = await User.find({}).select('-__v');
    return NextResponse.json(users);

  } catch (error) {
    console.error("Error fetching users:", error);
    
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return new NextResponse("Unauthorized", { status: 401 });
      }
      if (error.message.includes('Forbidden')) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    }
    
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Protect route - require admin permissions
    await protectApiRoute({ 
      permissions: ['users:create'],
      roles: ['admin', 'superadmin'] 
    });

    await dbConnect();

    const body = await request.json();
    
    // Validate input
    const validatedData = createUserSchema.parse(body);

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { clerkId: validatedData.clerkId },
        { email: validatedData.email }
      ]
    });

    if (existingUser) {
      return new NextResponse("User already exists", { status: 409 });
    }

    // Calculate hourly rate if salary is provided
    const hourlyRate = validatedData.salary ? validatedData.salary / 173 : undefined;

    // Create new user
    const newUser = new User({
      ...validatedData,
      hourlyRate,
      isActive: true,
    });

    await newUser.save();

    // Remove sensitive data from response
    const userResponse = {
      _id: newUser._id,
      clerkId: newUser.clerkId,
      name: newUser.name,
      email: newUser.email,
      department: newUser.department,
      designation: newUser.designation,
      roles: newUser.roles,
      isActive: newUser.isActive,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    };

    return NextResponse.json(userResponse, { status: 201 });

  } catch (error) {
    console.error("Error creating user:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return new NextResponse("Unauthorized", { status: 401 });
      }
      if (error.message.includes('Forbidden')) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    }
    
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}