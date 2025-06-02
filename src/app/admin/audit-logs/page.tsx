import React, { useState, useEffect } from 'react';

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

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">📋 Audit Logs</h1>
      {loading && <p>Loading audit logs...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {!loading && !error && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Recent Activities</h2>
          {/* Basic table for displaying logs */}
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b text-left">Timestamp</th>
                <th className="py-2 px-4 border-b text-left">User ID</th> {/* Could fetch user name later */}
                <th className="py-2 px-4 border-b text-left">Action</th>
                <th className="py-2 px-4 border-b text-left">Resource Type</th>
                <th className="py-2 px-4 border-b text-left">Resource ID</th>
                <th className="py-2 px-4 border-b text-left">Details</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map(log => (
                <tr key={log._id}>
                  <td className="py-2 px-4 border-b">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="py-2 px-4 border-b">{log.userId}</td>
                  <td className="py-2 px-4 border-b">{log.action}</td>
                  <td className="py-2 px-4 border-b">{log.resourceType}</td>
                  <td className="py-2 px-4 border-b">{log.resourceId || '-'}</td>
                  <td className="py-2 px-4 border-b">
                    {log.details ? (
                      <pre className="text-xs bg-gray-100 p-1 rounded overflow-auto max-h-20">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    ) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Pagination or more advanced filtering/display could be added here */}
        </div>
      )}
    </div>
  );
}