"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";

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

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">🏗️ Admin Dashboard</h1>
      
      {loading && <p>Loading admin statistics...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      
      {!loading && !error && (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold text-gray-700">Total Users</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold text-gray-700">Total Claims</h3>
              <p className="text-3xl font-bold text-green-600">{stats.totalClaims}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold text-gray-700">Overtime Requests</h3>
              <p className="text-3xl font-bold text-purple-600">{stats.totalOvertimeRequests}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold text-gray-700">Pending Approvals</h3>
              <p className="text-3xl font-bold text-orange-600">{stats.pendingApprovals}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold text-gray-700">Total Claim Amount</h3>
              <p className="text-3xl font-bold text-red-600">RM {stats.totalClaimAmount.toFixed(2)}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold text-gray-700">Total Overtime Amount</h3>
              <p className="text-3xl font-bold text-indigo-600">RM {stats.totalOvertimeAmount.toFixed(2)}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/admin/users">
                <Button className="w-full h-20 text-lg" variant="outline">
                  👥 Manage Users
                </Button>
              </Link>
              
              <Link href="/admin/rates">
                <Button className="w-full h-20 text-lg" variant="outline">
                  💰 Configure Rates
                </Button>
              </Link>
              
              <Link href="/admin/reports">
                <Button className="w-full h-20 text-lg" variant="outline">
                  📊 View Reports
                </Button>
              </Link>
              
              <Link href="/admin/audit-logs">
                <Button className="w-full h-20 text-lg" variant="outline">
                  📜 Audit Logs
                </Button>
              </Link>
            </div>
          </div>

          {/* Admin Features Overview */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Admin Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">👥 User Management</h3>
                <ul className="text-gray-700 space-y-1">
                  <li>• View all users</li>
                  <li>• Edit user roles and permissions</li>
                  <li>• Create new users</li>
                  <li>• Activate/deactivate accounts</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">💰 Rate Configuration</h3>
                <ul className="text-gray-700 space-y-1">
                  <li>• Set mileage rates</li>
                  <li>• Configure overtime rates</li>
                  <li>• Manage approval limits</li>
                  <li>• Update system settings</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">📊 Reports & Analytics</h3>
                <ul className="text-gray-700 space-y-1">
                  <li>• Generate expense reports</li>
                  <li>• View overtime statistics</li>
                  <li>• Export data for analysis</li>
                  <li>• Monitor system usage</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">📜 Audit & Compliance</h3>
                <ul className="text-gray-700 space-y-1">
                  <li>• View system audit logs</li>
                  <li>• Track user actions</li>
                  <li>• Monitor data changes</li>
                  <li>• Ensure compliance</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}