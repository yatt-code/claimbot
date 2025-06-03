"use client";

import AdminLayout from "@/components/AdminLayout";
import PendingSubmissionsList, { PendingItem } from "@/components/PendingSubmissionsList";
import { useRBAC } from "@/hooks/useRBAC";
import React, { useState, useEffect } from "react";

// Define interfaces for backend response structures based on SDS
interface User {
  _id: string;
  name: string;
}

interface Claim {
  _id: string;
  userId: string;
  createdAt: string;
  status: "draft" | "submitted" | "approved" | "rejected" | "paid";
}

interface Overtime {
  _id: string;
  userId: string;
  createdAt: string;
  status: "submitted" | "approved" | "rejected" | "paid";
}

export default function AdminApprovalsPage() {
  const rbac = useRBAC();
  const [pendingSubmissions, setPendingSubmissions] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user has approval permissions
  const canApprove = rbac.hasPermission('claims:approve');

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
        const pendingClaims = claims.filter(claim => claim.status === 'submitted');
        const pendingOvertime = overtime.filter(ot => ot.status === 'submitted');

        const combinedPendingSubmissions: PendingItem[] = [
          ...pendingClaims.map(claim => ({
            id: claim._id,
            user: userMap.get(claim.userId) || 'Unknown User',
            type: 'Expense' as const,
            date: new Date(claim.createdAt).toLocaleDateString(),
          })),
          ...pendingOvertime.map(ot => ({
            id: ot._id,
            user: userMap.get(ot.userId) || 'Unknown User',
            type: 'Overtime' as const,
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
  }, []);

  // If user doesn't have approval permissions, show access denied
  if (!canApprove) {
    return (
      <AdminLayout>
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">
            You don&apos;t have permission to access the approvals section.
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">✅ Pending Approvals</h1>
          <p className="text-gray-600 mt-1">
            Review and approve pending claims and overtime requests from your team.
          </p>
        </div>

        {/* Stats Summary */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow border">
              <h3 className="text-sm font-medium text-gray-700">Total Pending</h3>
              <p className="text-2xl font-bold text-orange-600">{pendingSubmissions.length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <h3 className="text-sm font-medium text-gray-700">Expense Claims</h3>
              <p className="text-2xl font-bold text-blue-600">
                {pendingSubmissions.filter(item => item.type === 'Expense').length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <h3 className="text-sm font-medium text-gray-700">Overtime Requests</h3>
              <p className="text-2xl font-bold text-purple-600">
                {pendingSubmissions.filter(item => item.type === 'Overtime').length}
              </p>
            </div>
          </div>
        )}

        {/* Content */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading pending submissions...</p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">Error: {error}</p>
          </div>
        )}
        
        {!loading && !error && pendingSubmissions.length > 0 && (
          <PendingSubmissionsList submissions={pendingSubmissions} />
        )}
        
        {!loading && !error && pendingSubmissions.length === 0 && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
            <p className="text-gray-500">No pending submissions found.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}