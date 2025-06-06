"use client";

import { useState, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { toast } from "sonner";

import AdminLayout from "@/components/AdminLayout";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useRBAC } from "@/hooks/useRBAC";
import { useRouter } from "next/navigation";

// Define the type for a salary verification request
interface SalaryVerificationRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  submittedMonthlySalary: number;
  submittedHourlyRate: number;
  submissionDate: string;
  status: "pending" | "verified" | "rejected"; // Changed "approved" to "verified"
  history?: { action: string; date: string; by: string }[];
}

// User interface for API response
interface ApiUser {
  _id: string;
  name?: string;
  email: string;
  monthlySalary?: number;
  hourlyRate?: number;
  salaryVerificationStatus?: "pending" | "verified" | "rejected";
  salarySubmittedAt?: string;
  updatedAt: string;
}

// Fetch salary verification requests from API
const fetchSalaryVerificationRequests = async (): Promise<SalaryVerificationRequest[]> => {
  try {
    const response = await fetch('/api/users');
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    const users: ApiUser[] = await response.json();
    
    console.log('DEBUG: Admin fetched users for salary verification:', {
      totalUsers: users.length,
      usersWithSalaryData: users.filter(u => u.monthlySalary !== undefined).length,
      usersWithPendingStatus: users.filter(u => u.salaryVerificationStatus === 'pending').length,
      usersWithSubmissionDate: users.filter(u => u.salarySubmittedAt).length,
      detailedUsers: users.map(u => ({
        email: u.email,
        monthlySalary: u.monthlySalary,
        hourlyRate: u.hourlyRate,
        salaryVerificationStatus: u.salaryVerificationStatus,
        salarySubmittedAt: u.salarySubmittedAt
      }))
    });
    
    // Filter users with actual salary submissions (not just default pending status)
    const filteredUsers = users
      .filter((user: ApiUser) => {
        const hasActualSalaryData = user.monthlySalary !== undefined && user.hourlyRate !== undefined;
        const hasSubmissionDate = user.salarySubmittedAt !== undefined;
        const hasPendingStatus = user.salaryVerificationStatus === 'pending';
        
        console.log(`DEBUG: User ${user.email}:`, {
          hasActualSalaryData,
          hasSubmissionDate,
          hasPendingStatus,
          monthlySalary: user.monthlySalary,
          salaryVerificationStatus: user.salaryVerificationStatus,
          salarySubmittedAt: user.salarySubmittedAt
        });
        
        // Only include users who have actually submitted salary data
        return hasActualSalaryData && hasSubmissionDate && hasPendingStatus;
      })
      .map((user: ApiUser) => ({
        id: user._id,
        userId: user._id,
        userName: user.name || 'Unknown',
        userEmail: user.email,
        submittedMonthlySalary: user.monthlySalary || 0,
        submittedHourlyRate: user.hourlyRate || 0,
        submissionDate: user.salarySubmittedAt || user.updatedAt,
        status: user.salaryVerificationStatus as "pending" | "verified" | "rejected",
        history: [] // TODO: Implement history tracking
      }));
    
    console.log('DEBUG: Filtered salary verification requests:', filteredUsers.length);
    return filteredUsers;
  } catch (error) {
    console.error('Error fetching salary verification requests:', error);
    return [];
  }
};

export default function SalaryVerificationPage() {
  const { hasAnyRole } = useRBAC(); // Destructure hasAnyRole
  const router = useRouter();
  const [data, setData] = useState<SalaryVerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");

  const canAccess = hasAnyRole(['manager', 'admin', 'superadmin']); // Use string literals directly

  useEffect(() => {
    if (!canAccess) {
      router.push("/access-denied");
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const requests = await fetchSalaryVerificationRequests();
        console.log('DEBUG: Loaded salary verification requests:', requests.length);
        setData(requests); // fetchSalaryVerificationRequests already filters for pending with actual submissions
      } catch (error) {
        console.error('Error loading salary verification data:', error);
        toast.error('Failed to load salary verification requests');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [canAccess, router]);

  const handleApprove = async (id: string) => {
    console.log('DEBUG: Approving salary verification for user:', id);
    
    const approveRequest = async () => {
      const response = await fetch(`/api/users/${id}/salary/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'verified',
          reason: 'Approved by admin'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve salary verification');
      }

      // Remove from pending list
      setData((prev) => prev.filter((req) => req.id !== id));
      
      // Trigger a refresh of the AdminLayout notification count
      window.dispatchEvent(new CustomEvent('salary-verification-updated'));
      
      return response.json();
    };

    toast.promise(approveRequest(), {
      loading: "Approving salary verification...",
      success: "Salary verification approved successfully!",
      error: (err) => `Failed to approve: ${err.message}`,
    });
  };

  const handleReject = async (id: string) => {
    console.log('DEBUG: Rejecting salary verification for user:', id);
    
    const rejectRequest = async () => {
      const response = await fetch(`/api/users/${id}/salary/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'rejected',
          reason: 'Rejected by admin - please resubmit with correct information'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject salary verification');
      }

      // Remove from pending list
      setData((prev) => prev.filter((req) => req.id !== id));
      
      // Trigger a refresh of the AdminLayout notification count
      window.dispatchEvent(new CustomEvent('salary-verification-updated'));
      
      return response.json();
    };

    toast.promise(rejectRequest(), {
      loading: "Rejecting salary verification...",
      success: "Salary verification rejected successfully!",
      error: (err) => `Failed to reject: ${err.message}`,
    });
  };

  const columns: ColumnDef<SalaryVerificationRequest>[] = [
    {
      accessorKey: "userName",
      header: "User Name",
      cell: ({ row }) => (
        <Button variant="link" onClick={() => router.push(`/admin/users/${row.original.userId}`)}>
          {row.getValue("userName")}
        </Button>
      ),
    },
    {
      accessorKey: "userEmail",
      header: "User Email",
    },
    {
      accessorKey: "submittedMonthlySalary",
      header: "Monthly Salary",
      cell: ({ row }) => `$${row.getValue("submittedMonthlySalary")?.toLocaleString()}`,
    },
    {
      accessorKey: "submittedHourlyRate",
      header: "Hourly Rate",
      cell: ({ row }) => `$${row.getValue("submittedHourlyRate")?.toLocaleString()}`,
    },
    {
      accessorKey: "submissionDate",
      header: "Submission Date",
      cell: ({ row }) => format(new Date(row.getValue("submissionDate")), "PPP"),
    },
    {
      accessorKey: "status",
      header: "Status",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const request = row.original;
        if (request.status !== "pending") {
          return <span className="text-gray-500">Actioned</span>;
        }
        return (
          <div className="flex space-x-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Approve
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Approve Salary Verification?</DialogTitle>
                  <DialogDescription>
                    This action will approve the salary verification request for {request.userName}.
                    Are you sure?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button onClick={() => handleApprove(request.id)}>Approve</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  Reject
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reject Salary Verification?</DialogTitle>
                  <DialogDescription>
                    This action will reject the salary verification request for {request.userName}.
                    Are you sure?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button variant="destructive" onClick={() => handleReject(request.id)}>
                    Reject
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        );
      },
    },
  ];

  if (!canAccess) {
    return null; // Or a loading spinner/access denied message while redirecting
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">Salary Verification Management</h1>
        <div className="flex justify-between items-center mb-4">
          <Input
            placeholder="Search all fields..."
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="max-w-sm"
          />
        </div>
        {loading ? (
          <div>Loading salary verification requests...</div>
        ) : (
          <DataTable columns={columns} data={data} globalFilter={globalFilter} setGlobalFilter={setGlobalFilter} />
        )}
      </div>
    </AdminLayout>
  );
}