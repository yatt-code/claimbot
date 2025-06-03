'use client';

import AdminLayout from "@/components/AdminLayout";
import { useRBAC } from "@/hooks/useRBAC";
import StatsCard from "@/components/admin/StatsCard";
import { useState, useEffect } from "react";

interface CategoryData {
  name: string;
  amount: number;
}

interface AnalyticsData {
  totalClaims: number;
  totalAmount: number;
  approvalRate: number;
  avgProcessingTime: number;
  monthlyTrend: string;
  topCategories: CategoryData[];
}

export default function AdminAnalyticsPage() {
  const rbac = useRBAC();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalClaims: 0,
    totalAmount: 0,
    approvalRate: 0,
    avgProcessingTime: 0,
    monthlyTrend: '+12%',
    topCategories: []
  });

  // Check analytics permissions
  const canViewBasicAnalytics = rbac.hasPermission('analytics:read:basic');
  const canViewFullAnalytics = rbac.hasPermission('analytics:read:full');
  const canViewFinancialAnalytics = rbac.hasPermission('analytics:read:financial');

  useEffect(() => {
    // Simulate loading analytics data
    const timer = setTimeout(() => {
      setAnalyticsData({
        totalClaims: 1247,
        totalAmount: 89650.75,
        approvalRate: 87.3,
        avgProcessingTime: 2.4,
        monthlyTrend: '+12%',
        topCategories: [
          { name: 'Travel', amount: 35420.50 },
          { name: 'Meals', amount: 28750.25 },
          { name: 'Office Supplies', amount: 15230.00 }
        ]
      });
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // If user doesn't have any analytics permissions, show access denied
  if (!canViewBasicAnalytics && !canViewFullAnalytics && !canViewFinancialAnalytics) {
    return (
      <AdminLayout>
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">
            You don&apos;t have permission to view analytics.
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
          <h1 className="text-2xl font-bold text-gray-900">📈 Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Insights and analytics for your expense management system.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading analytics data...</p>
          </div>
        )}

        {/* Analytics Content */}
        {!loading && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                title="Total Claims"
                value={analyticsData.totalClaims.toLocaleString()}
                trend={{ value: 12, isPositive: true }}
                color="blue"
                onClick={() => window.location.href = '/admin/approvals'}
              />
              
              {(canViewFullAnalytics || canViewFinancialAnalytics) && (
                <StatsCard
                  title="Total Amount"
                  value={`$${analyticsData.totalAmount.toLocaleString()}`}
                  trend={{ value: 12, isPositive: true }}
                  color="green"
                />
              )}
              
              <StatsCard
                title="Approval Rate"
                value={`${analyticsData.approvalRate}%`}
                trend={{ value: 3.2, isPositive: true }}
                color="purple"
              />
              
              <StatsCard
                title="Avg. Processing"
                value={`${analyticsData.avgProcessingTime} days`}
                trend={{ value: 0.5, isPositive: false }}
                color="orange"
              />
            </div>

            {/* Detailed Analytics for Full Access */}
            {canViewFullAnalytics && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Categories */}
                <div className="bg-white rounded-lg shadow border p-6">
                  <h3 className="text-lg font-semibold mb-4">Top Expense Categories</h3>
                  <div className="space-y-3">
                    {analyticsData.topCategories.map((category, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-gray-700">{category.name}</span>
                        <span className="font-medium">${category.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trends Chart Placeholder */}
                <div className="bg-white rounded-lg shadow border p-6">
                  <h3 className="text-lg font-semibold mb-4">Monthly Trends</h3>
                  <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl mb-2">📊</div>
                      <p className="text-gray-500">Chart visualization would go here</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Basic Analytics for Managers */}
            {canViewBasicAnalytics && !canViewFullAnalytics && (
              <div className="bg-white rounded-lg shadow border p-6">
                <h3 className="text-lg font-semibold mb-4">Team Summary</h3>
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">👥</div>
                  <p className="text-gray-600">Basic team analytics and approval metrics</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Contact your administrator for detailed analytics access
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}