"use client";

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useRBAC } from '@/hooks/useRBAC';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Define AuditLog interface based on expected backend response and AuditLog model
interface AuditLog {
  _id: string;
  userId: string; // ID of the user who performed the action
  action: string; // e.g., 'user.created', 'claim.approved'
  resourceType: string; // e.g., 'User', 'Claim', 'Overtime'
  resourceId?: string; // ID of the affected resource
  timestamp: string; // ISO date string
  details?: unknown; // Optional details about the action
}

export default function AdminAuditLogsPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // State for pagination or filtering could be added here later

  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
        // Assuming a backend route like /api/audit-logs exists
        const response = await fetch(`${baseUrl}/api/audit-logs`);

        if (!response.ok) {
          throw new Error(`Failed to fetch audit logs: ${response.statusText}`);
        }

        const data: AuditLog[] = await response.json();
        // Sort logs by timestamp in descending order (most recent first)
        const sortedLogs = data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setAuditLogs(sortedLogs);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(errorMessage);
        console.error("Error fetching audit logs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLogs();
  }, []); // Empty dependency array means this effect runs once on mount

  const { hasPermission } = useRBAC();

  // Check if user has permission to view audit logs
  if (!hasPermission('audit:read')) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-600 mb-2">Access Denied</h2>
            <p className="text-gray-500">You don&apos;t have permission to view audit logs.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📋 Audit Logs</h1>
          <p className="text-gray-600">Monitor system activities and user actions</p>
        </div>

        {loading && (
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <p className="text-gray-600">Loading audit logs...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 p-6 rounded-lg border border-red-200">
            <p className="text-red-600">Error: {error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Recent Activities</h2>
              <p className="text-gray-600 text-sm mt-1">
                {auditLogs.length} audit log{auditLogs.length !== 1 ? 's' : ''} found
              </p>
            </div>
            
            {auditLogs.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource Type</TableHead>
                      <TableHead>Resource ID</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map(log => (
                      <TableRow key={log._id}>
                        <TableCell className="font-mono text-sm">
                          {new Date(log.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{log.userId}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">
                            {log.action}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-md text-sm">
                            {log.resourceType}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{log.resourceId || '-'}</TableCell>
                        <TableCell>
                          {log.details ? (
                            <details className="cursor-pointer">
                              <summary className="text-blue-600 hover:text-blue-800 text-sm">
                                View Details
                              </summary>
                              <pre className="text-xs bg-gray-50 p-2 rounded mt-2 overflow-auto max-h-32 max-w-xs">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </details>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-6 text-center">
                <p className="text-gray-500">No audit logs found.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}