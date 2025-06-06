import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/db";
import User from "@/models/User";
import { protectApiRoute } from "@/lib/auth-utils";
import logger from "@/lib/logger";

export async function GET() {
  try {
    // Protect route - require manager/admin permissions for salary verification
    await protectApiRoute({ 
      roles: ['manager', 'admin', 'superadmin'] 
    });

    await dbConnect();

    // Count users with actual pending salary verifications
    // Only count users who have submitted salary data (have salarySubmittedAt)
    const pendingCount = await User.countDocuments({
      salaryVerificationStatus: 'pending',
      monthlySalary: { $exists: true, $ne: null },
      hourlyRate: { $exists: true, $ne: null },
      salarySubmittedAt: { $exists: true, $ne: null }
    });

    console.log('DEBUG: Pending salary verification count:', pendingCount);

    return NextResponse.json({ count: pendingCount });

  } catch (error) {
    console.error("Error fetching pending salary verification count:", error);
    
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return new NextResponse("Unauthorized", { status: 401 });
      }
      if (error.message.includes('Forbidden')) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    }
    
    logger.error("Error in pending count API:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}