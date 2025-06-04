import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/db";
import AuditLog from "@/models/AuditLog"; // Assuming AuditLog model is imported
import User from "@/models/User"; // Assuming User model is imported

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await dbConnect();

  try {
    // Fetch the authenticated user to check their role
    const authenticatedUser = await User.findOne({ clerkId: userId });

    // Basic role check: Only admin and superadmin can view audit logs
    if (!authenticatedUser || !authenticatedUser.hasAnyRole(['admin', 'superadmin'])) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Fetch all audit log entries
    // In a real application, you might want to add pagination, filtering, or sorting
    const auditLogs = await AuditLog.find({}).sort({ timestamp: -1 }); // Sort by timestamp descending

    return NextResponse.json(auditLogs);

  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// Optional: Add other handlers (e.g., POST, DELETE) if needed for audit logs management
// export async function POST(request: Request) { ... }