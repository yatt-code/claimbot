import RecentSubmissionsTable from "@/components/RecentSubmissionsTable"; // Can potentially rename this to SubmissionTable later

// Define the Submission type locally for fetched data
interface Submission {
  _id: string;
  date: string; // Will need to format date from fetched data
  type: "Expense" | "Overtime";
  status: "Approved" | "Pending" | "Rejected" | "Draft"; // Will need to map status from fetched data
  total: number; // Will need to calculate or extract total from fetched data
}

export default async function MySubmissionsPage() {
  // TODO: Implement proper error handling for fetch calls
  const fetchAllSubmissions = async () => {
    try {
      const claimsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/claims`);
      const overtimeResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/overtime`);

      if (!claimsResponse.ok) {
        console.error("Failed to fetch claims:", claimsResponse.statusText);
        return []; // Return empty array or handle error appropriately
      }
      if (!overtimeResponse.ok) {
        console.error("Failed to fetch overtime:", overtimeResponse.statusText);
        return []; // Return empty array or handle error appropriately
      }

      const claims = await claimsResponse.json();
      const overtime = await overtimeResponse.json();

      // Combine and format data (This is a simplified example, actual mapping will depend on backend response structure)
      const combinedSubmissions: Submission[] = [
        ...claims.map((claim: any) => ({
          _id: claim._id,
          date: new Date(claim.createdAt).toLocaleDateString(), // Assuming createdAt exists
          type: "Expense",
          status: claim.status, // Assuming status field exists
          total: claim.totalAmount || 0, // Assuming totalAmount exists
        })),
        ...overtime.map((ot: any) => ({
          _id: ot._id,
          date: new Date(ot.createdAt).toLocaleDateString(), // Assuming createdAt exists
          type: "Overtime",
          status: ot.status, // Assuming status field exists
          total: ot.calculatedAmount || 0, // Assuming calculatedAmount exists
        })),
      ];

      // Sort by date (most recent first)
      combinedSubmissions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return combinedSubmissions;

    } catch (error) {
      console.error("Error fetching submissions:", error);
      return []; // Return empty array or handle error appropriately
    }
  };

  const allSubmissions = await fetchAllSubmissions();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">🗂️ My Submissions</h1>
      {allSubmissions.length > 0 ? (
        <RecentSubmissionsTable submissions={allSubmissions} />
      ) : (
        <p>No submissions found.</p>
      )}
    </div>
  );
}