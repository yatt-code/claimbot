"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import AttachmentViewer, { Attachment } from "@/components/AttachmentViewer";
import StatusBadge from "@/components/StatusBadge";
import { SubmissionDetails } from "@/components/SubmissionDetailCard";

interface OvertimeDetailProps {
  params: {
    id: string;
  };
}

// Extended interface for overtime-specific details
interface OvertimeDetail extends SubmissionDetails {
  startTime?: string;
  endTime?: string;
  reason?: string;
  hoursWorked?: number;
  rateMultiplier?: number;
  hourlyRate?: number;
  totalPayout?: number;
  approvedBy?: string;
  approvedAt?: string;
  remarks?: string;
}

export default function OvertimeDetailPage({ params }: OvertimeDetailProps) {
  const overtimeId = params.id;
  const router = useRouter();

  const [overtimeDetails, setOvertimeDetails] = useState<OvertimeDetail | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleEdit = () => {
    if (overtimeDetails?.status === 'submitted') {
      router.push(`/submit/overtime?edit=${overtimeId}`);
    } else {
      toast.error('Only submitted overtime requests can be edited');
    }
  };

  const handleDelete = async () => {
    if (!overtimeDetails) return;

    if (overtimeDetails.status !== 'submitted') {
      toast.error('Only submitted overtime requests can be deleted');
      return;
    }

    if (!confirm('Are you sure you want to delete this overtime request? This action cannot be undone.')) {
      return;
    }

    const loadingToast = toast.loading('Deleting overtime request...');

    try {
      const response = await fetch(`/api/overtime/${overtimeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete overtime request.');
      }

      toast.success('Overtime request deleted successfully!', { id: loadingToast });
      router.push('/my-submissions');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast.error(`Delete failed: ${errorMessage}`, { id: loadingToast });
      console.error("Error deleting overtime request:", error);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  useEffect(() => {
    const fetchOvertimeDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch overtime request details
        const overtimeResponse = await fetch(`/api/overtime/${overtimeId}`);
        
        if (!overtimeResponse.ok) {
          if (overtimeResponse.status === 404) {
            setError("Overtime request not found.");
          } else if (overtimeResponse.status === 403) {
            setError("You don't have permission to view this overtime request.");
          } else {
            throw new Error(`Failed to fetch overtime request: ${overtimeResponse.statusText}`);
          }
          return;
        }

        const overtime = await overtimeResponse.json();

        // Fetch attachments for the overtime request
        try {
          const attachmentsResponse = await fetch(`/api/files?linkedToId=${overtimeId}`);
          if (attachmentsResponse.ok) {
            const fetchedAttachments: Attachment[] = await attachmentsResponse.json();
            setAttachments(fetchedAttachments);
          } else {
            console.error(`Failed to fetch attachments: ${attachmentsResponse.statusText}`);
            setAttachments([]);
          }
        } catch (attachErr) {
          console.error("Error fetching attachments:", attachErr);
          setAttachments([]);
        }

        // Map to display format
        const mappedOvertime: OvertimeDetail = {
          id: overtime._id,
          user: overtime.userId?.name || 'Unknown User',
          type: "Overtime",
          date: new Date(overtime.date).toLocaleDateString(),
          status: overtime.status,
          justification: overtime.reason,
          total: overtime.totalPayout,
          startTime: overtime.startTime,
          endTime: overtime.endTime,
          reason: overtime.reason,
          hoursWorked: overtime.hoursWorked,
          rateMultiplier: overtime.rateMultiplier,
          hourlyRate: overtime.hourlyRate,
          totalPayout: overtime.totalPayout,
          approvedBy: overtime.approvedBy?.name,
          approvedAt: overtime.approvedAt ? new Date(overtime.approvedAt).toLocaleDateString() : undefined,
          remarks: overtime.remarks,
        };

        setOvertimeDetails(mappedOvertime);

      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(errorMessage);
        console.error("Error fetching overtime details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOvertimeDetails();
  }, [overtimeId]);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading overtime details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️ {error}</div>
          <button
            onClick={handleGoBack}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!overtimeDetails) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <div className="text-gray-500 text-xl mb-4">Overtime request not found</div>
          <button
            onClick={handleGoBack}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">⏰ Overtime Request Details</h1>
          <p className="text-gray-600 mt-1">View and manage your overtime request</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGoBack}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            ← Back
          </button>
          {overtimeDetails.status === 'submitted' && (
            <>
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                ✏️ Edit
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                🗑️ Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-6">
        <StatusBadge status={overtimeDetails.status === 'submitted' ? 'Pending' : 
                             overtimeDetails.status === 'approved' ? 'Approved' : 
                             overtimeDetails.status === 'rejected' ? 'Rejected' : 'Pending'} />
      </div>

      {/* Enhanced Details Card */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Overtime Request Information
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Complete details of your overtime request submission.
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Request ID</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{overtimeDetails.id}</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Date</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{overtimeDetails.date}</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Time Period</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {overtimeDetails.startTime} - {overtimeDetails.endTime}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Hours Worked</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {overtimeDetails.hoursWorked?.toFixed(2) || '0.00'} hours
              </dd>
            </div>
            {overtimeDetails.reason && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Reason</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{overtimeDetails.reason}</dd>
              </div>
            )}
            
            {/* Rate Information */}
            {(overtimeDetails.hourlyRate || overtimeDetails.rateMultiplier) && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Rate Information</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="space-y-1">
                    {overtimeDetails.hourlyRate && (
                      <div className="flex justify-between">
                        <span>Hourly Rate:</span>
                        <span>RM {overtimeDetails.hourlyRate.toFixed(2)}/hour</span>
                      </div>
                    )}
                    {overtimeDetails.rateMultiplier && (
                      <div className="flex justify-between">
                        <span>Rate Multiplier:</span>
                        <span>{overtimeDetails.rateMultiplier}x</span>
                      </div>
                    )}
                  </div>
                </dd>
              </div>
            )}

            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Total Payout</dt>
              <dd className="mt-1 text-sm font-bold text-gray-900 sm:mt-0 sm:col-span-2">
                RM {overtimeDetails.totalPayout?.toFixed(2) || '0.00'}
              </dd>
            </div>

            {overtimeDetails.approvedBy && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Approved By</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{overtimeDetails.approvedBy}</dd>
              </div>
            )}

            {overtimeDetails.approvedAt && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Approved At</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{overtimeDetails.approvedAt}</dd>
              </div>
            )}

            {overtimeDetails.remarks && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Remarks</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{overtimeDetails.remarks}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="mb-6">
          <AttachmentViewer attachments={attachments} />
        </div>
      )}

      {/* Action Buttons for submitted status */}
      {overtimeDetails.status === 'submitted' && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Pending Approval
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>This overtime request has been submitted and is pending approval. You can still edit or delete it if needed.</p>
              </div>
              <div className="mt-4">
                <div className="flex space-x-2">
                  <button
                    onClick={handleEdit}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm hover:bg-blue-200 transition-colors"
                  >
                    Edit Request
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}