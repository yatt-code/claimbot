"use client";

import SubmissionTable from "@/components/SubmissionTable";
import StaffLayout from "@/components/StaffLayout";
import { useState, useEffect } from "react";

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
    <StaffLayout>
      <div className="space-y-6">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading submissions...</span>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">Error: {error}</p>
          </div>
        )}
        
        {!loading && !error && allSubmissions.length > 0 && (
          <div className="bg-white rounded-lg shadow border">
            <SubmissionTable submissions={allSubmissions.map(sub => ({
              _id: sub._id,
              date: new Date(sub.createdAt).toLocaleDateString(),
              type: sub.type,
              status: sub.status,
              total: sub.type === "Expense" ? sub.totalAmount ?? 0 : sub.calculatedAmount ?? 0,
            }))} />
          </div>
        )}
        
        {!loading && !error && allSubmissions.length === 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-500 mb-4">No submissions found yet.</p>
            <p className="text-sm text-gray-400">
              Start by submitting your first expense claim or overtime request!
            </p>
          </div>
        )}
      </div>
    </StaffLayout>
  );
}