"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { IUser, UserRole } from '@/models/User';
import { SalaryVerificationCard, SalaryVerificationRequest } from '@/components/admin/SalaryVerificationCard';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';
import { format } from "date-fns";

// Use IUser directly for the User type
type User = IUser;

export default function AdminUserDetailPage({ params }: UserDetailPageProps) {
  const userId = params.id;
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [salaryVerificationRequest, setSalaryVerificationRequest] = useState<SalaryVerificationRequest | null>(null);

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
        setFormData(data);
        
        if (data.salaryVerificationStatus === 'pending' || data.monthlySalary || data.hourlyRate) {
          setSalaryVerificationRequest({
            id: data._id as string,
            userId: data._id as string,
            userName: data.name || '',
            userEmail: data.email,
            submittedMonthlySalary: data.monthlySalary || 0,
            submittedHourlyRate: data.hourlyRate || 0,
            submissionDate: data.salarySubmittedAt?.toISOString() || new Date().toISOString(),
            status: data.salaryVerificationStatus || 'pending',
            history: [],
          });
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(errorMessage);
        console.error("Error fetching user:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

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
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save user.');
      }

      const updatedUser: User = await response.json();
      setUser(updatedUser);
      toast.success('User saved successfully!', { id: loadingToast });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      toast.error(`Failed to save user: ${errorMessage}`, { id: loadingToast });
      console.error("Error saving user:", err);
    }
  };

  const handleApproveSalary = async () => {
    const loadingToast = toast.loading('Approving salary...');
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
      const response = await fetch(`${baseUrl}/api/users/${userId}/salary/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'verified' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to approve salary.');
      }

      const updatedUser: User = await response.json();
      setUser(updatedUser);
      setSalaryVerificationRequest((prev: SalaryVerificationRequest | null): SalaryVerificationRequest | null => {
        if (!prev) return null;
        return { ...prev, status: 'verified' };
      });
      toast.success('Salary approved successfully!', { id: loadingToast });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      toast.error(`Failed to approve salary: ${errorMessage}`, { id: loadingToast });
      console.error("Error approving salary:", err);
    }
  };

  const handleRejectSalary = async () => {
    const loadingToast = toast.loading('Rejecting salary...');
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
      const response = await fetch(`${baseUrl}/api/users/${userId}/salary/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reject salary.');
      }

      const updatedUser: User = await response.json();
      setUser(updatedUser);
      setSalaryVerificationRequest((prev: SalaryVerificationRequest | null): SalaryVerificationRequest | null => {
        if (!prev) return null;
        return { ...prev, status: 'rejected' };
      });
      toast.success('Salary rejected successfully!', { id: loadingToast });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      toast.error(`Failed to reject salary: ${errorMessage}`, { id: loadingToast });
      console.error("Error rejecting salary:", err);
    }
  };

  const handleCancel = () => {
    router.push('/admin/users');
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
        {/* Existing User Details Section */}
        <h2 className="text-xl font-semibold mb-4">User Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              disabled
            />
          </div>
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700">Department:</label>
            <input
              type="text"
              id="department"
              name="department"
              value={formData.department || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>
          <div>
            <label htmlFor="designation" className="block text-sm font-medium text-gray-700">Designation:</label>
            <input
              type="text"
              id="designation"
              name="designation"
              value={formData.designation || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>
          <div>
            <label htmlFor="roles" className="block text-sm font-medium text-gray-700">Roles:</label>
            <select
              id="roles"
              name="roles"
              value={formData.roles?.[0] || ''}
              onChange={e => setFormData({ ...formData, roles: [e.target.value as UserRole] })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            >
              <option value="staff">Staff</option>
              <option value="manager">Manager</option>
              <option value="finance">Finance</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Superadmin</option>
            </select>
          </div>
          <div>
            <label htmlFor="isActive" className="block text-sm font-medium text-gray-700">Status:</label>
            <select
              id="isActive"
              name="isActive"
              value={formData.isActive ? 'active' : 'inactive'}
              onChange={e => setFormData({ ...formData, isActive: e.target.value === 'active' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSaveUser}>
            Save Changes
          </Button>
        </div>

        <Separator className="my-8" />

        {/* Salary Verification Section */}
        <h2 className="text-xl font-semibold mb-4">Salary Verification</h2>
        {salaryVerificationRequest ? (
          <SalaryVerificationCard
            request={salaryVerificationRequest}
            onApprove={handleApproveSalary}
            onReject={handleRejectSalary}
          />
        ) : (
          <div className="p-4 border rounded-md text-center text-gray-500">
            No pending salary verification request for this user.
            {user.monthlySalary && user.hourlyRate && (
              <p className="mt-2">
                Current Salary: Monthly ${user.monthlySalary.toLocaleString()}, Hourly ${user.hourlyRate.toLocaleString()}
              </p>
            )}
            {user.salaryVerificationStatus === 'verified' && (
              <p className="mt-2 text-green-600">
                Salary Verified on {user.salaryVerifiedAt ? format(new Date(user.salaryVerifiedAt), "PPP") : 'N/A'} by {user.salaryVerifiedBy || 'N/A'}
              </p>
            )}
            {user.salaryVerificationStatus === 'rejected' && (
              <p className="mt-2 text-red-600">
                Salary Rejected on {user.salaryVerifiedAt ? format(new Date(user.salaryVerifiedAt), "PPP") : 'N/A'} by {user.salaryVerifiedBy || 'N/A'}
              </p>
            )}
            <Dialog>
              <DialogTrigger asChild>
                <Button className="mt-4" variant="outline">Manually Verify/Reject</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Manual Salary Action</DialogTitle>
                  <DialogDescription>
                    Choose to manually verify or reject the user's salary.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex justify-end gap-2">
                  <Button variant="outline">Cancel</Button>
                  <Button onClick={() => handleApproveSalary()}>Verify Now</Button>
                  <Button variant="destructive" onClick={() => handleRejectSalary()}>Reject Now</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  );
}

interface UserDetailPageProps {
  params: {
    id: string;
  };
}