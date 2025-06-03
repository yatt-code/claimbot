"use client";

import AdminLayout from "@/components/AdminLayout";
import StatsCard from "@/components/admin/StatsCard";
import QuickActions from "@/components/admin/QuickActions";
import { useRBAC } from "@/hooks/useRBAC";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Define the statistics interface
interface AdminStats {
  totalUsers: number;
  totalClaims: number;
  totalOvertimeRequests: number;
  pendingApprovals: number;
  totalClaimAmount: number;
  totalOvertimeAmount: number;
}

interface ClaimData {
  _id: string;
  status: string;
  totalClaim?: number;
}

interface OvertimeData {
  _id: string;
  status: string;
  totalPayout?: number;
}


export default function AdminDashboard() {
  const { user, isLoaded } = useUser();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalClaims: 0,
    totalOvertimeRequests: 0,
    pendingApprovals: 0,
    totalClaimAmount: 0,
    totalOvertimeAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use RBAC hook for role checking
  const rbac = useRBAC();
  const router = useRouter();

  // Determine user's role for dashboard customization
  const isManager = rbac.hasAnyRole(['manager', 'admin', 'superadmin']);
  const isAdmin = rbac.hasAnyRole(['admin', 'superadmin']);
  const isSuperAdmin = rbac.hasRole('superadmin');

  useEffect(() => {
    const fetchAdminStats = async () => {
      if (!isLoaded || !user) return;

      try {
        setLoading(true);
        
        // Fetch basic statistics from various endpoints
        const [usersResponse, claimsResponse, overtimeResponse] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/claims'),
          fetch('/api/overtime'),
        ]);

        const users = usersResponse.ok ? await usersResponse.json() : [];
        const claims = claimsResponse.ok ? await claimsResponse.json() : [];
        const overtime = overtimeResponse.ok ? await overtimeResponse.json() : [];

        // Calculate statistics
        const pendingClaims = claims.filter((claim: ClaimData) => claim.status === 'submitted').length;
        const pendingOvertime = overtime.filter((ot: OvertimeData) => ot.status === 'submitted').length;
        const totalClaimAmount = claims.reduce((sum: number, claim: ClaimData) => sum + (claim.totalClaim || 0), 0);
        const totalOvertimeAmount = overtime.reduce((sum: number, ot: OvertimeData) => sum + (ot.totalPayout || 0), 0);

        setStats({
          totalUsers: users.length,
          totalClaims: claims.length,
          totalOvertimeRequests: overtime.length,
          pendingApprovals: pendingClaims + pendingOvertime,
          totalClaimAmount,
          totalOvertimeAmount,
        });

      } catch (err: unknown) {
        setError(`Failed to load admin statistics: ${err instanceof Error ? err.message : 'Unknown error'}`);
        console.error("Error fetching admin stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminStats();
  }, [isLoaded, user]);

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  // Generate role-specific stats cards
  const getStatsCards = () => {
    const cards = [];

    if (isManager) {
      cards.push(
        <StatsCard
          key="pending"
          title="Pending Approvals"
          value={stats.pendingApprovals}
          icon="⏳"
          color="orange"
          subtitle="Items awaiting review"
          onClick={() => router.push('/admin/approvals')}
        />
      );
    }

    if (isAdmin) {
      cards.push(
        <StatsCard
          key="users"
          title="Total Users"
          value={stats.totalUsers}
          icon="👥"
          color="blue"
          subtitle="Registered accounts"
          onClick={() => router.push('/admin/users')}
        />
      );
    }

    // Common stats for all admin/manager roles
    cards.push(
      <StatsCard
        key="claims"
        title="Total Claims"
        value={stats.totalClaims}
        icon="💳"
        color="green"
        subtitle="All time submissions"
      />,
      <StatsCard
        key="overtime"
        title="Overtime Requests"
        value={stats.totalOvertimeRequests}
        icon="⏰"
        color="purple"
        subtitle="All time requests"
      />
    );

    if (isAdmin) {
      cards.push(
        <StatsCard
          key="claim-amount"
          title="Total Claim Amount"
          value={`RM ${stats.totalClaimAmount.toFixed(2)}`}
          icon="💰"
          color="red"
          subtitle="Total processed amount"
        />,
        <StatsCard
          key="overtime-amount"
          title="Total Overtime Amount"
          value={`RM ${stats.totalOvertimeAmount.toFixed(2)}`}
          icon="💵"
          color="indigo"
          subtitle="Total overtime payouts"
        />
      );
    }

    return cards;
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isSuperAdmin ? '👑 Superadmin' : isAdmin ? '🏗️ Admin' : '👔 Manager'} Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome back, {user?.firstName}! Here&apos;s what&apos;s happening in your organization.
          </p>
        </div>

        {/* Loading/Error States */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading dashboard statistics...</p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">Error: {error}</p>
          </div>
        )}

        {/* Statistics Cards */}
        {!loading && !error && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getStatsCards()}
            </div>

            {/* Quick Actions */}
            <QuickActions />

            {/* Role-specific information */}
            {isSuperAdmin && (
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-purple-900 mb-2">👑 Superadmin Privileges</h3>
                <p className="text-purple-700 text-sm">
                  You have full system access including user management, system configuration,
                  audit logs, and all administrative functions. Use these powers responsibly.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}