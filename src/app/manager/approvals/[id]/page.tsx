import React, { useState, useEffect } from "react"; // Import useState and useEffect
import SubmissionDetailCard, { SubmissionDetails } from "@/components/SubmissionDetailCard";
import AttachmentViewer, { Attachment } from "@/components/AttachmentViewer";
import ActionButtons from "@/components/ActionButtons";
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface SubmissionDetailProps {
  params: {
    id: string; // The submission ID from the URL
  };
}

// Define interfaces for backend response structures based on SDS (copied from approvals page for now)
interface User {
  _id: string;
  name: string;
  // Add other user fields if needed, but _id and name are sufficient for the map
}

interface Claim {
  _id: string;
  userId: string;
  createdAt: string;
  status: "draft" | "submitted" | "approved" | "rejected" | "paid";
  description?: string;
  totalClaim?: number;
  // Add other claim fields if needed
}

interface Overtime {
  _id: string;
  userId: string;
  createdAt: string;
  status: "submitted" | "approved" | "rejected" | "paid";
  reason?: string;
  totalPayout?: number;
  // Add other overtime fields if needed
}


export default function SubmissionDetailPage({ params }: SubmissionDetailProps) {
  const submissionId = params.id;

  const [submissionDetails, setSubmissionDetails] = useState<SubmissionDetails | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
const router = useRouter();

  const handleApprove = async (id: string) => {
    if (!submissionDetails) return;

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const endpoint = submissionDetails.type === 'Expense' ? `${baseUrl}/api/claims/${id}/approve` : `${baseUrl}/api/overtime/${id}/approve`;
    const loadingToast = toast.loading(`Approving ${submissionDetails.type} submission...`);

    try {
      const response = await fetch(endpoint, {
        method: 'POST', // Assuming POST for approve action based on development plan
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to approve ${submissionDetails.type} submission.`);
      }

      toast.success(`${submissionDetails.type} submission approved successfully!`, { id: loadingToast });
      router.push('/manager/approvals'); // Redirect back to approvals list
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast.error(`Approval failed: ${errorMessage}`, { id: loadingToast });
      console.error("Error approving submission:", error);
    }
  };

  const handleReject = async (id: string, remarks: string) => {
     if (!submissionDetails) return;

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const endpoint = submissionDetails.type === 'Expense' ? `${baseUrl}/api/claims/${id}` : `${baseUrl}/api/overtime/${id}`;
    const loadingToast = toast.loading(`Rejecting ${submissionDetails.type} submission...`);

    try {
      const response = await fetch(endpoint, {
        method: 'PATCH', // Assuming PATCH to update status and remarks
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
      router.push('/manager/approvals'); // Redirect back to approvals list
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
        method: 'PATCH', // Assuming PATCH to update remarks
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ remarks: comment }), // Assuming remarks field is used for comments
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to add comment to ${submissionDetails.type} submission.`);
      }

      toast.success(`Comment added to ${submissionDetails.type} submission successfully!`, { id: loadingToast });
      // TODO: Optionally refresh submission details to show the new comment
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast.error(`Failed to add comment: ${errorMessage}`, { id: loadingToast });
      console.error("Error adding comment:", error);
    }
  };
  const [error, setError] = useState<string | null>(null);


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
          // If not found, that's expected, but other errors should be thrown
          throw new Error(`Failed to fetch claim: ${claimResponse.statusText}`);
        }

        // If not found as a claim, attempt to fetch as overtime
        if (!submission) {
          const overtimeResponse = await fetch(`${baseUrl}/api/overtime/${submissionId}`);
          if (overtimeResponse.ok) {
            submission = await overtimeResponse.json();
            submissionType = "Overtime";
          } else if (overtimeResponse.status !== 404) {
            // If not found, that's expected, but other errors should be thrown
            throw new Error(`Failed to fetch overtime: ${overtimeResponse.statusText}`);
          }
        }

        if (!submission || !submissionType) {
          setError("Submission not found.");
          setSubmissionDetails(null);
          return; // Stop execution if submission is not found
        }

        // Fetch user details for the submission
        const userResponse = await fetch(`${baseUrl}/api/users/${submission.userId}`);
        if (!userResponse.ok) {
          throw new Error(`Failed to fetch user details: ${userResponse.statusText}`);
        }
        const user: User = await userResponse.json(); // Type user properly

        // Fetch attachments for the submission
        const attachmentsResponse = await fetch(`${baseUrl}/api/files?linkedToId=${submissionId}`);
        if (!attachmentsResponse.ok) {
           // Log the error but don't fail the whole fetch if attachments can't be loaded
           console.error(`Failed to fetch attachments: ${attachmentsResponse.statusText}`);
           setAttachments([]); // Set to empty array on error
        } else {
           const fetchedAttachments: Attachment[] = await attachmentsResponse.json(); // Type fetchedAttachments properly
           setAttachments(fetchedAttachments);
        }


        // Map fetched data to SubmissionDetails interface
        const mappedSubmission: SubmissionDetails = {
          id: submission._id,
          user: user.name || 'Unknown User', // Use fetched user name
          type: submissionType,
          date: new Date(submission.createdAt).toLocaleDateString(),
          status: submission.status,
          // Include type-specific fields
          description: submissionType === 'Expense' ? (submission as Claim).description : undefined,
          justification: submissionType === 'Overtime' ? (submission as Overtime).reason : undefined,
          total: submissionType === 'Expense' ? (submission as Claim).totalClaim : (submission as Overtime).totalPayout,
        };

        setSubmissionDetails(mappedSubmission);

      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(errorMessage);
        console.error("Error fetching submission details:", err);
        setSubmissionDetails(null); // Clear details on error
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissionDetails();
  }, [submissionId]); // Re-run effect if submissionId changes


  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">🔍 Submission Details</h1>
      {loading && <p>Loading submission details...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {!loading && !error && submissionDetails ? (
        <>
          <SubmissionDetailCard submission={submissionDetails} />
          {attachments.length > 0 && <AttachmentViewer attachments={attachments} />}
          {/* ActionButtons will need actual handler functions */}
          <ActionButtons
            submissionId={submissionId}
            onApprove={handleApprove}
            onReject={handleReject}
            onAddComment={handleAddComment}
          />
        </>
      ) : (!loading && !error && <p>Submission not found.</p>) // Display not found if not loading, no error, and no details
      }
    </div>
  );
}