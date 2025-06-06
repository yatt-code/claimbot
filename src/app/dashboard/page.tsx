'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import SubmissionTable from "@/components/SubmissionTable";
import StaffLayout from "@/components/StaffLayout";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";

// Define the API response types
interface ClaimResponse {
  _id: string;
  createdAt: string;
  status: "Approved" | "Pending" | "Rejected" | "Draft";
  totalClaim?: number;
  totalAmount?: number;
}

interface OvertimeResponse {
  _id: string;
  createdAt: string;
  status: "Approved" | "Pending" | "Rejected" | "Draft";
  totalPayout?: number;
  calculatedAmount?: number;
}

// Define the Submission type for display
interface Submission {
  _id: string;
  createdAt: string;
  type: "Expense" | "Overtime";
  status: "Approved" | "Pending" | "Rejected" | "Draft";
  totalAmount?: number;
  calculatedAmount?: number;
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!isLoaded || !user) return;

      try {
        setLoading(true);
        
        // Fetch submissions from API routes
        const [claimsResponse, overtimeResponse] = await Promise.all([
          fetch('/api/claims'),
          fetch('/api/overtime')
        ]);

        // Handle 404 as empty data (no submissions yet)
        let claims: ClaimResponse[] = [];
        let overtime: OvertimeResponse[] = [];

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
          ...claims.map((claim: ClaimResponse): Submission => ({
            _id: claim._id,
            createdAt: claim.createdAt,
            type: "Expense",
            status: claim.status,
            totalAmount: claim.totalClaim || claim.totalAmount,
          })),
          ...overtime.map((ot: OvertimeResponse): Submission => ({
            _id: ot._id,
            createdAt: ot.createdAt,
            type: "Overtime",
            status: ot.status,
            calculatedAmount: ot.totalPayout || ot.calculatedAmount,
          })),
        ];

        // Sort by creation date (most recent first)
        combinedSubmissions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Limit to 5 recent submissions
        setRecentSubmissions(combinedSubmissions.slice(0, 5));
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while fetching data.';
        setError(errorMessage);
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [isLoaded, user]);

  if (!isLoaded) {
    return (
      <div className="container mx-auto py-8 px-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8 px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">Please sign in to access the dashboard.</p>
          <Link href="/auth/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentDate = new Date().toLocaleDateString();
  const userName = user.firstName || user.fullName || "User";

  return (
    <StaffLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl md:text-2xl font-bold mb-1">
              Hello, {userName} 👋
            </h1>
            <p className="text-gray-600">Today&apos;s Date: {currentDate}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <Link href="/submit/expense">
            <Button className="w-full md:w-auto bg-blue-600 hover:bg-blue-700">
              + Submit Expense
            </Button>
          </Link>
          <Link href="/submit/overtime">
            <Button className="w-full md:w-auto bg-green-600 hover:bg-green-700">
              + Submit Overtime
            </Button>
          </Link>
          <Link href="/my-submissions">
            <Button variant="outline" className="w-full md:w-auto">
              📄 View All Submissions
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500">Pending Claims</h3>
            <p className="text-2xl font-bold text-orange-600">
              {recentSubmissions.filter(s => s.status === 'Pending').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500">Approved This Month</h3>
            <p className="text-2xl font-bold text-green-600">
              {recentSubmissions.filter(s => s.status === 'Approved').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500">Total Submitted</h3>
            <p className="text-2xl font-bold text-blue-600">
              {recentSubmissions.length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500">Draft Items</h3>
            <p className="text-2xl font-bold text-gray-600">
              {recentSubmissions.filter(s => s.status === 'Draft').length}
            </p>
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="space-y-4">
          <h2 className="text-lg md:text-xl font-semibold">📄 My Recent Submissions</h2>
          
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading recent submissions...</span>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">Error: {error}</p>
            </div>
          )}
          
          {!loading && !error && recentSubmissions.length > 0 && (
            <div className="bg-white rounded-lg shadow border">
              <SubmissionTable
                submissions={recentSubmissions.map(sub => ({
                  _id: sub._id,
                  date: new Date(sub.createdAt).toLocaleDateString(),
                  type: sub.type,
                  status: sub.status,
                  total: sub.type === "Expense" ? sub.totalAmount ?? 0 : sub.calculatedAmount ?? 0,
                }))}
              />
            </div>
          )}
          
          {!loading && !error && recentSubmissions.length === 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <p className="text-gray-500 mb-4">No submissions found yet.</p>
              <p className="text-sm text-gray-400">
                Start by submitting your first expense claim or overtime request!
              </p>
            </div>
          )}
        </div>
      </div>
    </StaffLayout>
  );
}