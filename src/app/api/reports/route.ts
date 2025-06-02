import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Claim from "@/models/Claim"; // Assuming Claim model is imported
import Overtime from "@/models/Overtime"; // Assuming Overtime model is imported
import User from "@/models/User"; // Assuming User model is imported

// Define a local interface for report data rows returned by the backend
interface BackendReportRow {
  id: string;
  userId: string;
  type: 'Claim' | 'Overtime';
  date: string; // ISO date string
  status: string;
  description?: string; // For claims
  justification?: string; // For overtime
  total?: number; // Claim total or overtime payout
}
export async function GET(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await dbConnect();

  try {
    // Fetch the authenticated user to check their role
    const authenticatedUser = await User.findOne({ clerkId: userId });

    // Basic role check: Only admin can generate reports
    if (!authenticatedUser || authenticatedUser.role !== 'admin') {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const reportType = searchParams.get('reportType'); // 'all', 'claims', 'overtime'

    if (!startDateParam || !endDateParam || !reportType) {
        return new NextResponse("Missing required report criteria: startDate, endDate, and reportType", { status: 400 });
    }

    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);

    // Add 23 hours, 59 minutes, 59 seconds to the end date to include the whole day
    endDate.setHours(23, 59, 59, 999);


    let reportData: BackendReportRow[] = [];

    // Define a common projection to select necessary fields and rename _id to id
    const commonProjection = {
        _id: 0, // Exclude _id
        id: '$_id', // Include _id as id
        userId: 1,
        createdAt: 1,
        status: 1,
    };

    // Fetch Claims if reportType is 'all' or 'claims'
    if (reportType === 'all' || reportType === 'claims') {
        const claims = await Claim.find({
            createdAt: { $gte: startDate, $lte: endDate },
            // Add other claim-specific filters if needed
        }, { ...commonProjection, description: 1, totalClaim: 1 }).lean(); // Use lean() for plain JavaScript objects

        reportData = reportData.concat(claims.map(claim => ({
            id: claim.id, // Use the projected id
            userId: claim.userId,
            type: 'Claim',
            date: claim.createdAt.toISOString(),
            status: claim.status,
            total: claim.totalClaim,
            description: claim.description,
            justification: undefined,
        } as BackendReportRow))); // Explicitly cast to BackendReportRow
    }

    // Fetch Overtime if reportType is 'all' or 'overtime'
    if (reportType === 'all' || reportType === 'overtime') {
        const overtimeEntries = await Overtime.find({
            createdAt: { $gte: startDate, $lte: endDate },
            // Add other overtime-specific filters if needed
        }, { ...commonProjection, reason: 1, totalPayout: 1 }).lean(); // Use lean() for plain JavaScript objects

        reportData = reportData.concat(overtimeEntries.map(overtime => ({
            id: overtime.id, // Use the projected id
            userId: overtime.userId,
            type: 'Overtime',
            date: overtime.createdAt.toISOString(),
            status: overtime.status,
            total: overtime.totalPayout,
            justification: overtime.reason,
            description: undefined,
        } as BackendReportRow))); // Explicitly cast to BackendReportRow
    }

    // Fetch user names for all unique user IDs in the report data
    const userIds = [...new Set(reportData.map(item => item.userId))];
    const users = await User.find({ _id: { $in: userIds } }, { _id: 1, name: 1 }).lean();
    const userMap = users.reduce((map, user) => {
        map[(user._id as string).toString()] = user.name; // Explicitly cast _id to string
        return map;
    }, {} as { [key: string]: string });

    // Map user IDs to user names in the report data
    const finalReportData = reportData.map(item => ({
        ...item,
        user: userMap[item.userId.toString()] || 'Unknown User',
        // Remove userId as it's replaced by user name
        userId: undefined,
    }));


    return NextResponse.json(finalReportData);

  } catch (error) {
    console.error("Error generating report:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}