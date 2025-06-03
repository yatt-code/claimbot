"use client";

import AdminLayout from "@/components/AdminLayout";
import SubmissionDetailCard, { SubmissionDetails } from "@/components/SubmissionDetailCard";
import AttachmentViewer, { Attachment } from "@/components/AttachmentViewer";
import ActionButtons from "@/components/ActionButtons";
import { useRBAC } from "@/hooks/useRBAC";
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import React, { useState, useEffect } from "react";

interface SubmissionDetailProps {
  params: {
    id: string;
  };
}

interface User {
  _id: string;
  name: string;
}

interface Claim {
  _id: string;
  userId: string;
  createdAt: string;
  status: "draft" | "submitted" | "approved" | "rejected" | "paid";
  description?: string;
  totalClaim?: number;
}

interface Overtime {
  _id: string;
  userId: string;
  createdAt: string;
  status: "submitted" | "approved" | "rejected" | "paid";
  reason?: string;
  totalPayout?: number;
}

export default function AdminSubmissionDetailPage({ params }: SubmissionDetailProps) {
  const submissionId = params.id;
  const rbac = useRBAC();
  const router = useRouter();

  const [submissionDetails, setSubmissionDetails] = useState<SubmissionDetails | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user has approval permissions
  const canApprove = rbac.hasPermission('claims:approve');

  const handleApprove = async (id: string) => {
    if (!submissionDetails) return;

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const endpoint = submissionDetails.type === 'Expense' ? `${baseUrl}/api/claims/${id}/approve` : `${baseUrl}/api/overtime/${id}/approve`;
    const loadingToast = toast.loading(`Approving ${submissionDetails.type} submission...`);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'approved' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to approve ${submissionDetails.type} submission.`);
      }

      toast.success(`${submissionDetails.type} submission approved successfully!`, { id: loadingToast });
      router.push('/admin/approvals');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast.error(`Approval failed: ${errorMessage}`, { id: loadingToast });
      console.error("Error approving submission:", error);
    }
  };

  const handleReject = async (id: string, remarks: string) => {
    if (!submissionDetails) return;

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const loadingToast = toast.loading(`Rejecting ${submissionDetails.type} submission...`);

    try {
      // Use approve endpoint for consistency (both approve and reject)
      const rejectEndpoint = submissionDetails.type === 'Expense' ? `${baseUrl}/api/claims/${id}/approve` : `${baseUrl}/api/overtime/${id}/approve`;
      
      const response = await fetch(rejectEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'rejected', remarks }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to reject ${submissionDetails.type} submission.`);
      }

      toast.success(`${submissionDetails.type} submission rejected successfully!`, { id: loadingToast });
      router.push('/admin/approvals');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast.error(`Rejection failed: ${errorMessage}`, { id: loadingToast });
      console.error("Error rejecting submission:", error);
    }
  };

  const handleAddComment = async (id: string, comment: string) => {
    if (!submissionDetails) return;

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const endpoint = submissionDetails.type === 'Expense' ? `${baseUrl}/api/claims/${id}` : `${baseUrl}/api/overtime/${id}`;
    const loadingToast = toast.loading(`Adding comment to ${submissionDetails.type} submission...`);

    try {
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ remarks: comment }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to add comment to ${submissionDetails.type} submission.`);
      }

      toast.success(`Comment added to ${submissionDetails.type} submission successfully!`, { id: loadingToast });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast.error(`Failed to add comment: ${errorMessage}`, { id: loadingToast });
      console.error("Error adding comment:", error);
    }
  };

  useEffect(() => {
    const fetchSubmissionDetails = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
        let submission: Claim | Overtime | null = null;
        let submissionType: "Expense" | "Overtime" | null = null;

        // Attempt to fetch as a claim
        const claimResponse = await fetch(`${baseUrl}/api/claims/${submissionId}`);
        if (claimResponse.ok) {
          submission = await claimResponse.json();
          submissionType = "Expense";
        } else if (claimResponse.status !== 404) {
          throw new Error(`Failed to fetch claim: ${claimResponse.statusText}`);
        }

        // If not found as a claim, attempt to fetch as overtime
        if (!submission) {
          const overtimeResponse = await fetch(`${baseUrl}/api/overtime/${submissionId}`);
          if (overtimeResponse.ok) {
            submission = await overtimeResponse.json();
            submissionType = "Overtime";
          } else if (overtimeResponse.status !== 404) {
            throw new Error(`Failed to fetch overtime: ${overtimeResponse.statusText}`);
          }
        }

        if (!submission || !submissionType) {
          setError("Submission not found.");
          setSubmissionDetails(null);
          return;
        }

        // Check if userId is populated (object) or just an ID (string)
        let user: User;
        if (typeof submission.userId === 'object' && submission.userId !== null) {
          // If userId is populated with user data, use it directly
          user = submission.userId as User;
        } else {
          // If userId is just an ID, fetch user details
          const userResponse = await fetch(`${baseUrl}/api/users/${submission.userId}`);
          if (!userResponse.ok) {
            throw new Error(`Failed to fetch user details: ${userResponse.statusText}`);
          }
          user = await userResponse.json();
        }

        // Fetch attachments for the submission
        const attachmentsResponse = await fetch(`${baseUrl}/api/files?linkedToId=${submissionId}`);
        if (!attachmentsResponse.ok) {
          console.error(`Failed to fetch attachments: ${attachmentsResponse.statusText}`);
          setAttachments([]);
        } else {
          const fetchedAttachments: Attachment[] = await attachmentsResponse.json();
          setAttachments(fetchedAttachments);
        }

        // Map fetched data to SubmissionDetails interface
        const mappedSubmission: SubmissionDetails = {
          id: submission._id,
          user: user.name || 'Unknown User',
          type: submissionType,
          date: new Date(submission.createdAt).toLocaleDateString(),
          status: submission.status,
          description: submissionType === 'Expense' ? (submission as Claim).description : undefined,
          justification: submissionType === 'Overtime' ? (submission as Overtime).reason : undefined,
          total: submissionType === 'Expense' ? (submission as Claim).totalClaim : (submission as Overtime).totalPayout,
        };

        setSubmissionDetails(mappedSubmission);

      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(errorMessage);
        console.error("Error fetching submission details:", err);
        setSubmissionDetails(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissionDetails();
  }, [submissionId]);

  // If user doesn't have approval permissions, show access denied
  if (!canApprove) {
    return (
      <AdminLayout>
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">
            You don&apos;t have permission to access submission details.
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <span>←</span>
            <span>Back to Approvals</span>
          </button>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">🔍 Submission Details</h1>
          <p className="text-gray-600 mt-1">
            Review and take action on this submission.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading submission details...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">Error: {error}</p>
          </div>
        )}

        {/* Content */}
        {!loading && !error && submissionDetails ? (
          <div className="space-y-6">
            <SubmissionDetailCard submission={submissionDetails} />
            {attachments.length > 0 && <AttachmentViewer attachments={attachments} />}
            <ActionButtons
              submissionId={submissionId}
              onApprove={handleApprove}
              onReject={handleReject}
              onAddComment={handleAddComment}
            />
          </div>
        ) : (
          !loading && !error && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📄</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Submission not found</h3>
              <p className="text-gray-500">The requested submission could not be found.</p>
            </div>
          )
        )}
      </div>
    </AdminLayout>
  );
}