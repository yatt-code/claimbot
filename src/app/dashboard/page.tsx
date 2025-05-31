import { Button } from "@/components/ui/button";
import Link from "next/link";
import RecentSubmissionsTable from "@/components/RecentSubmissionsTable";
import { currentUser } from "@clerk/nextjs/server";
import { useState, useEffect } from "react"; // Import useState and useEffect


// Define the Submission type based on expected backend response
interface Submission {
  _id: string;
  createdAt: string; // Assuming backend provides creation date
  type: "Expense" | "Overtime"; // Need to determine type from endpoint
  status: "Approved" | "Pending" | "Rejected" | "Draft"; // Assuming status field exists
  totalAmount?: number; // For Expense
  calculatedAmount?: number; // For Overtime
}

export default function DashboardPage() {
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState("User"); // Use state for user name

  useEffect(() => {
    const fetchUserDataAndSubmissions = async () => {
      try {
        // Fetch user data
        const user = await currentUser();
        setUserName(user?.firstName || "User");

        // Fetch submissions
        const claimsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/claims`);
        const overtimeResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/overtime`);

        if (!claimsResponse.ok) {
          throw new Error(`Failed to fetch claims: ${claimsResponse.statusText}`);
        }
        if (!overtimeResponse.ok) {
          throw new Error(`Failed to fetch overtime: ${overtimeResponse.statusText}`);
        }

        const claims = await claimsResponse.json();
        const overtime = await overtimeResponse.json();

        // Combine and format data
        const combinedSubmissions: Submission[] = [
          ...claims.map((claim: Submission): Submission => ({
            _id: claim._id,
            createdAt: claim.createdAt,
            type: "Expense",
            status: claim.status,
            totalAmount: claim.totalAmount,
          })),
          ...overtime.map((ot: Submission): Submission => ({
            _id: ot._id,
            createdAt: ot.createdAt,
            type: "Overtime",
            status: ot.status,
            calculatedAmount: ot.calculatedAmount,
          })),
        ];

        // Sort by creation date (most recent first)
        combinedSubmissions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Limit to a certain number for recent submissions, e.g., 5
        setRecentSubmissions(combinedSubmissions.slice(0, 5));

      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while fetching data.';
        setError(errorMessage);
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDataAndSubmissions();
  }, []); // Empty dependency array means this effect runs once on mount

  const currentDate = new Date().toLocaleDateString();

  return (
    <div className="container mx-auto py-4 px-4 md:py-8 md:px-6"> {/* Added responsive padding */}
      <h1 className="text-xl md:text-2xl font-bold mb-4">Hello, {userName} 👋 Today&apos;s Date: {currentDate}</h1> {/* Adjusted heading size */}

      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-8"> {/* Adjusted button layout */}
        <Link href="/submit/expense">
          <Button className="w-full md:w-auto">+ Submit Expense</Button> {/* Made button full width on small screens */}
        </Link>
        <Link href="/submit/overtime">
          <Button className="w-full md:w-auto">+ Submit Overtime</Button> {/* Made button full width on small screens */}
        </Link>
      </div>

      <h2 className="text-lg md:text-xl font-semibold mb-4">📄 My Recent Submissions</h2> {/* Adjusted heading size */}
      {loading && <p>Loading recent submissions...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {!loading && !error && recentSubmissions.length > 0 && (
        <RecentSubmissionsTable submissions={recentSubmissions.map(sub => ({
          _id: sub._id,
          date: new Date(sub.createdAt).toLocaleDateString(),
          type: sub.type,
          status: sub.status,
          total: sub.type === "Expense" ? sub.totalAmount ?? 0 : sub.calculatedAmount ?? 0,
        }))} />
      )}
      {!loading && !error && recentSubmissions.length === 0 && (
        <p>No recent submissions found.</p>
      )}
    </div>
  );
}