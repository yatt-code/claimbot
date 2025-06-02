"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast'; // Assuming react-hot-toast for notifications
import { useRouter } from 'next/navigation'; // For redirection after saving/canceling

// Define User interface based on expected backend response (should match the one in admin/users/page.tsx)
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

interface UserDetailPageProps {
  params: {
    id: string; // The user ID from the URL
  };
}

export default function AdminUserDetailPage({ params }: UserDetailPageProps) {
  const userId = params.id;
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({}); // State for form data

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
        const response = await fetch(`${baseUrl}/api/users/${userId}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch user: ${response.statusText}`);
        }

        const data: User = await response.json();
        setUser(data);
        setFormData(data); // Initialize form data with fetched user data
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(errorMessage);
        console.error("Error fetching user:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]); // Re-run effect if userId changes

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSaveUser = async () => {
    if (!user) return;

    const loadingToast = toast.loading('Saving user...');

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
      const response = await fetch(`${baseUrl}/api/users/${userId}`, {
        method: 'PATCH', // Assuming PATCH for updating user
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData), // Send form data in the body
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save user.');
      }

      const updatedUser: User = await response.json();
      setUser(updatedUser); // Update local state with saved data
      toast.success('User saved successfully!', { id: loadingToast });
      // Optionally redirect back to the user list or show a success message
      // router.push('/admin/users');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      toast.error(`Failed to save user: ${errorMessage}`, { id: loadingToast });
      console.error("Error saving user:", err);
    }
  };

  const handleCancel = () => {
    router.push('/admin/users'); // Redirect back to the user list
  };

  if (loading) {
    return <div className="container mx-auto py-8"><p>Loading user details...</p></div>;
  }

  if (error) {
    return <div className="container mx-auto py-8"><p className="text-red-500">Error: {error}</p></div>;
  }

  if (!user) {
    return <div className="container mx-auto py-8"><p>User not found.</p></div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">✏️ Edit User: {user.name}</h1>
      <div className="bg-white p-6 rounded shadow-md">
        <div className="mb-4">
          <label htmlFor="name" className="block text-gray-700 font-bold mb-2">Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name || ''}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-700 font-bold mb-2">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email || ''}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            disabled // Email is likely managed by Clerk and not directly editable here
          />
        </div>
        <div className="mb-4">
          <label htmlFor="role" className="block text-gray-700 font-bold mb-2">Role:</label>
          <select
            id="role"
            name="role"
            value={formData.role || ''}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="staff">Staff</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="mb-4">
          <label htmlFor="status" className="block text-gray-700 font-bold mb-2">Status:</label>
          <select
            id="status"
            name="status"
            value={formData.status || ''}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="flex items-center justify-between">
          <button
            onClick={handleSaveUser}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Save Changes
          </button>
          <button
            onClick={handleCancel}
            className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}