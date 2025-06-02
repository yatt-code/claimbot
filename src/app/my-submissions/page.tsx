"use client";

import SubmissionTable from "@/components/SubmissionTable";
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

// Define the Claim type for API response
interface ClaimFromAPI {
  _id: string;
  createdAt: string;
  status: "Approved" | "Pending" | "Rejected" | "Draft";
  totalClaim?: number; // Database field name
}

export default function MySubmissionsPage() {
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllSubmissions = async () => {
      try {
        const claimsResponse = await fetch('/api/claims');
        const overtimeResponse = await fetch('/api/overtime');

        // Handle 404 as empty data (no submissions yet)
        let claims = [];
        let overtime = [];

        if (claimsResponse.ok) {
          claims = await claimsResponse.json();
        } else if (claimsResponse.status !== 404) {
          console.warn('Claims API error:', claimsResponse.status, claimsResponse.statusText);
        }

        if (overtimeResponse.ok) {
          overtime = await overtimeResponse.json();
        } else if (overtimeResponse.status !== 404) {
          console.warn('Overtime API error:', overtimeResponse.status, overtimeResponse.statusText);
        }

        // Combine and format data
        const combinedSubmissions: Submission[] = [
          ...claims.map((claim: ClaimFromAPI) => ({
            _id: claim._id,
            createdAt: claim.createdAt,
            type: "Expense",
            status: claim.status,
            totalAmount: claim.totalClaim, // Use totalClaim from database
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
        <SubmissionTable submissions={allSubmissions.map(sub => ({
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