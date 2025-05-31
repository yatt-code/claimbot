import RecentSubmissionsTable from "@/components/RecentSubmissionsTable"; // Can potentially rename this to SubmissionTable later
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

export default function MySubmissionsPage() {
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllSubmissions = async () => {
      try {
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
          ...claims.map((claim: Submission) => ({
            _id: claim._id,
            createdAt: claim.createdAt,
            type: "Expense",
            status: claim.status,
            totalAmount: claim.totalAmount,
          })),
          ...overtime.map((ot: Submission) => ({
            _id: ot._id,
            createdAt: ot.createdAt,
            type: "Overtime",
            status: ot.status,
            calculatedAmount: ot.calculatedAmount,
          })),
        ];

        // Sort by creation date (most recent first)
        combinedSubmissions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setAllSubmissions(combinedSubmissions);

      } catch (err: unknown) {
        setError(`Failed to load submissions: ${err instanceof Error ? err.message : 'An unknown error occurred'}`);
        setAllSubmissions([]); // Clear submissions on error
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllSubmissions();
  }, []); // Empty dependency array means this effect runs once on mount


  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">🗂️ My Submissions</h1>
      {loading && <p>Loading submissions...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {!loading && !error && allSubmissions.length > 0 && (
        <RecentSubmissionsTable submissions={allSubmissions.map(sub => ({
          _id: sub._id,
          date: new Date(sub.createdAt).toLocaleDateString(),
          type: sub.type,
          status: sub.status,
          total: sub.type === "Expense" ? sub.totalAmount ?? 0 : sub.calculatedAmount ?? 0,
        }))} />
      )}
      {!loading && !error && allSubmissions.length === 0 && (
        <p>No submissions found.</p>
      )}
    </div>
  );
}