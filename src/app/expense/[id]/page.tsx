"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import AttachmentViewer, { Attachment } from "@/components/AttachmentViewer";
import StatusBadge from "@/components/StatusBadge";
import { SubmissionDetails } from "@/components/SubmissionDetailCard";

interface ExpenseDetailProps {
  params: {
    id: string;
  };
}

// Extended interface for expense-specific details
interface ExpenseDetail extends SubmissionDetails {
  project?: string;
  expenses?: {
    mileage?: number;
    toll?: number;
    petrol?: number;
    meal?: number;
    others?: number;
  };
  mileageRate?: number;
  totalClaim?: number;
  submittedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  remarks?: string;
}

export default function ExpenseDetailPage({ params }: ExpenseDetailProps) {
  const expenseId = params.id;
  const router = useRouter();

  const [expenseDetails, setExpenseDetails] = useState<ExpenseDetail | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleEdit = () => {
    if (expenseDetails?.status === 'draft') {
      router.push(`/submit/expense?edit=${expenseId}`);
    } else {
      toast.error('Only draft submissions can be edited');
    }
  };

  const handleDelete = async () => {
    if (!expenseDetails) return;

    if (expenseDetails.status !== 'draft') {
      toast.error('Only draft submissions can be deleted');
      return;
    }

    if (!confirm('Are you sure you want to delete this expense claim? This action cannot be undone.')) {
      return;
    }

    const loadingToast = toast.loading('Deleting expense claim...');

    try {
      const response = await fetch(`/api/claims/${expenseId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete expense claim.');
      }

      toast.success('Expense claim deleted successfully!', { id: loadingToast });
      router.push('/my-submissions');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast.error(`Delete failed: ${errorMessage}`, { id: loadingToast });
      console.error("Error deleting expense claim:", error);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  useEffect(() => {
    const fetchExpenseDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch expense claim details
        const claimResponse = await fetch(`/api/claims/${expenseId}`);
        
        if (!claimResponse.ok) {
          if (claimResponse.status === 404) {
            setError("Expense claim not found.");
          } else if (claimResponse.status === 403) {
            setError("You don't have permission to view this expense claim.");
          } else {
            throw new Error(`Failed to fetch expense claim: ${claimResponse.statusText}`);
          }
          return;
        }

        const expense = await claimResponse.json();

        // Fetch attachments for the expense claim
        try {
          const attachmentsResponse = await fetch(`/api/files?linkedToId=${expenseId}`);
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
        const mappedExpense: ExpenseDetail = {
          id: expense._id,
          user: expense.userId?.name || 'Unknown User',
          type: "Expense",
          date: new Date(expense.date).toLocaleDateString(),
          status: expense.status,
          description: expense.description,
          total: expense.totalClaim,
          project: expense.project,
          expenses: expense.expenses,
          mileageRate: expense.mileageRate,
          totalClaim: expense.totalClaim,
          submittedAt: expense.submittedAt ? new Date(expense.submittedAt).toLocaleDateString() : undefined,
          approvedBy: expense.approvedBy?.name,
          approvedAt: expense.approvedAt ? new Date(expense.approvedAt).toLocaleDateString() : undefined,
          remarks: expense.remarks,
        };

        setExpenseDetails(mappedExpense);

      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(errorMessage);
        console.error("Error fetching expense details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchExpenseDetails();
  }, [expenseId]);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading expense details...</p>
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

  if (!expenseDetails) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <div className="text-gray-500 text-xl mb-4">Expense claim not found</div>
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
          <h1 className="text-2xl font-bold text-gray-900">💰 Expense Claim Details</h1>
          <p className="text-gray-600 mt-1">View and manage your expense claim</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGoBack}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            ← Back
          </button>
          {expenseDetails.status === 'draft' && (
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
        <StatusBadge status={expenseDetails.status === 'submitted' ? 'Pending' :
                             expenseDetails.status === 'approved' ? 'Approved' :
                             expenseDetails.status === 'rejected' ? 'Rejected' :
                             expenseDetails.status === 'draft' ? 'Draft' : 'Pending'} />
      </div>

      {/* Enhanced Details Card */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Expense Claim Information
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Complete details of your expense claim submission.
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Claim ID</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{expenseDetails.id}</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Date</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{expenseDetails.date}</dd>
            </div>
            {expenseDetails.project && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Project</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{expenseDetails.project}</dd>
              </div>
            )}
            {expenseDetails.description && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{expenseDetails.description}</dd>
              </div>
            )}
            
            {/* Expense Breakdown */}
            {expenseDetails.expenses && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Expense Breakdown</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="space-y-1">
                    {expenseDetails.expenses.mileage !== undefined && expenseDetails.expenses.mileage > 0 && (
                      <div className="flex justify-between">
                        <span>Mileage:</span>
                        <span>RM {expenseDetails.expenses.mileage.toFixed(2)}</span>
                      </div>
                    )}
                    {expenseDetails.expenses.toll !== undefined && expenseDetails.expenses.toll > 0 && (
                      <div className="flex justify-between">
                        <span>Toll:</span>
                        <span>RM {expenseDetails.expenses.toll.toFixed(2)}</span>
                      </div>
                    )}
                    {expenseDetails.expenses.petrol !== undefined && expenseDetails.expenses.petrol > 0 && (
                      <div className="flex justify-between">
                        <span>Petrol:</span>
                        <span>RM {expenseDetails.expenses.petrol.toFixed(2)}</span>
                      </div>
                    )}
                    {expenseDetails.expenses.meal !== undefined && expenseDetails.expenses.meal > 0 && (
                      <div className="flex justify-between">
                        <span>Meal:</span>
                        <span>RM {expenseDetails.expenses.meal.toFixed(2)}</span>
                      </div>
                    )}
                    {expenseDetails.expenses.others !== undefined && expenseDetails.expenses.others > 0 && (
                      <div className="flex justify-between">
                        <span>Others:</span>
                        <span>RM {expenseDetails.expenses.others.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </dd>
              </div>
            )}

            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Total Claim Amount</dt>
              <dd className="mt-1 text-sm font-bold text-gray-900 sm:mt-0 sm:col-span-2">
                RM {expenseDetails.totalClaim?.toFixed(2) || '0.00'}
              </dd>
            </div>

            {expenseDetails.submittedAt && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Submitted At</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{expenseDetails.submittedAt}</dd>
              </div>
            )}

            {expenseDetails.approvedBy && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Approved By</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{expenseDetails.approvedBy}</dd>
              </div>
            )}

            {expenseDetails.approvedAt && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Approved At</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{expenseDetails.approvedAt}</dd>
              </div>
            )}

            {expenseDetails.remarks && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Remarks</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{expenseDetails.remarks}</dd>
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

      {/* Action Buttons for draft status */}
      {expenseDetails.status === 'draft' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Draft Status
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>This expense claim is still in draft status. You can edit or delete it, or submit it for approval.</p>
              </div>
              <div className="mt-4">
                <div className="flex space-x-2">
                  <button
                    onClick={handleEdit}
                    className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded text-sm hover:bg-yellow-200 transition-colors"
                  >
                    Edit Claim
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