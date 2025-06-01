import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast'; // Assuming react-hot-toast for notifications
import Link from 'next/link'; // For linking to user detail pages

// Define User interface based on expected backend response
interface User {
  _id: string;
  clerkId: string; // Clerk user ID
  name: string;
  email: string;
  role: 'staff' | 'manager' | 'admin'; // Example roles
  status: 'active' | 'inactive'; // Example status
  createdAt: string;
  updatedAt: string;
  // Add other user fields as needed
}

export default function AdminUserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
        const response = await fetch(`${baseUrl}/api/users`);

        if (!response.ok) {
          throw new Error(`Failed to fetch users: ${response.statusText}`);
        }

        const data: User[] = await response.json();
        setUsers(data);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(errorMessage);
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Placeholder functions for future implementation
  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      const loadingToast = toast.loading('Deleting user...');
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
        const response = await fetch(`${baseUrl}/api/users/${userId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete user.');
        }

        // Remove the deleted user from the state
        setUsers(users.filter(user => user._id !== userId));
        toast.success('User deleted successfully!', { id: loadingToast });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        toast.error(`Failed to delete user: ${errorMessage}`, { id: loadingToast });
        console.error("Error deleting user:", err);
      }
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">👥 Admin User Management</h1>
      {loading && <p>Loading users...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {!loading && !error && (
        <div>
          <h2 className="text-xl font-semibold mb-2">User List</h2>
          {/* Link to create new user page/modal - to be implemented */}
          <Link href="/admin/users/new" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mb-4 inline-block">
            Add New User
          </Link>
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Name</th>
                <th className="py-2 px-4 border-b">Email</th>
                <th className="py-2 px-4 border-b">Role</th>
                <th className="py-2 px-4 border-b">Status</th>
                <th className="py-2 px-4 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id}>
                  <td className="py-2 px-4 border-b">{user.name}</td>
                  <td className="py-2 px-4 border-b">{user.email}</td>
                  <td className="py-2 px-4 border-b">{user.role}</td>
                  <td className="py-2 px-4 border-b">{user.status}</td>
                  <td className="py-2 px-4 border-b">
                    {/* Link to view/edit user details - to be implemented */}
                    <Link href={`/admin/users/${user._id}`} className="text-blue-500 hover:underline mr-2">View/Edit</Link>
                    <button
                      onClick={() => handleDeleteUser(user._id)}
                      className="text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}