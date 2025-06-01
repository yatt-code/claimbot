import PendingSubmissionsList, { PendingItem } from "@/components/PendingSubmissionsList";
import React, { useState, useEffect } from "react"; // Import useState and useEffect

// Define interfaces for backend response structures based on SDS
interface User {
  _id: string;
  name: string;
  // Add other user fields if needed, but _id and name are sufficient for the map
}

interface Claim {
  _id: string;
  userId: string;
  createdAt: string;
  status: "draft" | "submitted" | "approved" | "rejected" | "paid";
  // Add other claim fields if needed for detail view later
}

interface Overtime {
  _id: string;
  userId: string;
  createdAt: string;
  status: "submitted" | "approved" | "rejected" | "paid";
  // Add other overtime fields if needed for detail view later
}

export default function ManagerApprovalsPage() {
  const [pendingSubmissions, setPendingSubmissions] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPendingSubmissions = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

        // Fetch users to create a user map
        const usersResponse = await fetch(`${baseUrl}/api/users`);
        if (!usersResponse.ok) {
          throw new Error(`Failed to fetch users: ${usersResponse.statusText}`);
        }
        const users: User[] = await usersResponse.json();
        const userMap = new Map(users.map(user => [user._id, user.name]));

        // Fetch claims and overtime
        const claimsResponse = await fetch(`${baseUrl}/api/claims`);
        const overtimeResponse = await fetch(`${baseUrl}/api/overtime`);

        if (!claimsResponse.ok) {
          throw new Error(`Failed to fetch claims: ${claimsResponse.statusText}`);
        }
        if (!overtimeResponse.ok) {
          throw new Error(`Failed to fetch overtime: ${overtimeResponse.statusText}`);
        }

        const claims: Claim[] = await claimsResponse.json();
        const overtime: Overtime[] = await overtimeResponse.json();

        // Filter for pending submissions and combine
        const pendingClaims = claims.filter(claim => claim.status === 'submitted'); // Claims are 'submitted' before manager approval
        const pendingOvertime = overtime.filter(ot => ot.status === 'submitted'); // Overtime is 'submitted' before manager approval

        const combinedPendingSubmissions: PendingItem[] = [
          ...pendingClaims.map(claim => ({
            id: claim._id,
            user: userMap.get(claim.userId) || 'Unknown User',
            type: 'Expense' as const, // Explicitly cast to literal type
            date: new Date(claim.createdAt).toLocaleDateString(),
          })),
          ...pendingOvertime.map(ot => ({
            id: ot._id,
            user: userMap.get(ot.userId) || 'Unknown User',
            type: 'Overtime' as const, // Explicitly cast to literal type
            date: new Date(ot.createdAt).toLocaleDateString(),
          })),
        ];

        setPendingSubmissions(combinedPendingSubmissions);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(errorMessage);
        console.error("Error fetching pending submissions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingSubmissions();
  }, []); // Empty dependency array means this effect runs once on mount

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">🧾 Pending Approvals</h1>
      {loading && <p>Loading pending submissions...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {!loading && !error && pendingSubmissions.length > 0 && (
        <PendingSubmissionsList submissions={pendingSubmissions} />
      )}
      {!loading && !error && pendingSubmissions.length === 0 && (
        <p>No pending submissions found.</p>
      )}
    </div>
  );
}
