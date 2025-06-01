import React from 'react';

// Define a basic interface for submission details based on common fields
export interface SubmissionDetails {
  id: string;
  user: string;
  type: "Expense" | "Overtime";
  date: string;
  status: string;
  // Add other common fields or specific fields as needed for display
  description?: string; // For Expense
  justification?: string; // For Overtime
  total?: number; // For Expense or Overtime payout
}

interface SubmissionDetailCardProps {
  submission: SubmissionDetails;
}

const SubmissionDetailCard: React.FC<SubmissionDetailCardProps> = ({ submission }) => {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Submission Details
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Details of the {submission.type} submission.
        </p>
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
        <dl className="sm:divide-y sm:divide-gray-200">
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">User</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{submission.user}</dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Type</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{submission.type}</dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Date</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{submission.date}</dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Status</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{submission.status}</dd>
          </div>
          {submission.description && (
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{submission.description}</dd>
            </div>
          )}
           {submission.justification && (
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Justification</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{submission.justification}</dd>
            </div>
          )}
           {submission.total !== undefined && (
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Total Amount/Payout</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{submission.total.toFixed(2)}</dd>
            </div>
          )}
          {/* TODO: Add more fields based on submission type (e.g., mileage, toll, start/end time) */}
        </dl>
      </div>
    </div>
  );
};

export default SubmissionDetailCard;