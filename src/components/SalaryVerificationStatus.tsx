import React from "react";
import { CheckCircle, XCircle, Clock, Info, Calendar } from "lucide-react";

type SalaryVerificationStatusType =
  | "not_submitted"
  | "pending"
  | "verified"
  | "rejected";

interface SalaryVerificationStatusProps {
  status: SalaryVerificationStatusType;
  message?: string;
  canReviewSalary?: boolean;
  nextReviewYear?: number;
  lastSalaryReviewYear?: number;
}

export function SalaryVerificationStatus({
  status,
  message,
  canReviewSalary,
  nextReviewYear,
  lastSalaryReviewYear,
}: SalaryVerificationStatusProps) {
  let icon;
  let statusText;
  let statusColorClass;
  let additionalInfo = "";

  // Generate additional info based on review eligibility
  if (canReviewSalary !== undefined) {
    if (status === "verified") {
      if (canReviewSalary) {
        additionalInfo = "Annual salary review is available.";
      } else if (nextReviewYear) {
        additionalInfo = `Next review available in ${nextReviewYear}.`;
      }
    } else if (status === "pending") {
      additionalInfo = "Review submitted, waiting for admin approval.";
    } else if (status === "rejected" && canReviewSalary) {
      additionalInfo = "You can submit a new review.";
    }
  }

  switch (status) {
    case "not_submitted":
      icon = <Info className="h-5 w-5 text-blue-500" />;
      statusText = "Salary Review Required";
      statusColorClass = "text-blue-700 bg-blue-100 border-blue-200";
      break;
    case "pending":
      icon = <Clock className="h-5 w-5 text-yellow-500" />;
      statusText = "Pending Verification";
      statusColorClass = "text-yellow-700 bg-yellow-100 border-yellow-200";
      break;
    case "verified":
      if (canReviewSalary) {
        icon = <Calendar className="h-5 w-5 text-blue-500" />;
        statusText = "Review Available";
        statusColorClass = "text-blue-700 bg-blue-100 border-blue-200";
      } else {
        icon = <CheckCircle className="h-5 w-5 text-green-500" />;
        statusText = "Salary Verified";
        statusColorClass = "text-green-700 bg-green-100 border-green-200";
      }
      break;
    case "rejected":
      icon = <XCircle className="h-5 w-5 text-red-500" />;
      statusText = "Review Rejected";
      statusColorClass = "text-red-700 bg-red-100 border-red-200";
      break;
    default:
      icon = <Info className="h-5 w-5 text-gray-500" />;
      statusText = "Unknown Status";
      statusColorClass = "text-gray-700 bg-gray-100 border-gray-200";
  }

  return (
    <div className={`flex flex-col gap-2 p-4 rounded-lg border-2 ${statusColorClass}`}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-medium">{statusText}</span>
      </div>
      
      {(message || additionalInfo) && (
        <div className="text-sm space-y-1">
          {message && <p>{message}</p>}
          {additionalInfo && <p className="italic">{additionalInfo}</p>}
        </div>
      )}
      
      {lastSalaryReviewYear && status === "verified" && (
        <div className="text-xs opacity-75">
          Last reviewed: {lastSalaryReviewYear}
        </div>
      )}
    </div>
  );
}