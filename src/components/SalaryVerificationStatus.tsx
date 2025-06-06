import React from "react";
import { CheckCircle, XCircle, Clock, Info } from "lucide-react"; // Assuming lucide-react for icons

type SalaryVerificationStatusType =
  | "not_submitted"
  | "pending"
  | "verified"
  | "rejected";

interface SalaryVerificationStatusProps {
  status: SalaryVerificationStatusType;
  message?: string;
}

export function SalaryVerificationStatus({
  status,
  message,
}: SalaryVerificationStatusProps) {
  let icon;
  let statusText;
  let statusColorClass;

  switch (status) {
    case "not_submitted":
      icon = <Info className="h-5 w-5 text-blue-500" />;
      statusText = "Not Submitted";
      statusColorClass = "text-blue-700 bg-blue-100";
      break;
    case "pending":
      icon = <Clock className="h-5 w-5 text-yellow-500" />;
      statusText = "Pending Verification";
      statusColorClass = "text-yellow-700 bg-yellow-100";
      break;
    case "verified":
      icon = <CheckCircle className="h-5 w-5 text-green-500" />;
      statusText = "Verified";
      statusColorClass = "text-green-700 bg-green-100";
      break;
    case "rejected":
      icon = <XCircle className="h-5 w-5 text-red-500" />;
      statusText = "Rejected";
      statusColorClass = "text-red-700 bg-red-100";
      break;
    default:
      icon = <Info className="h-5 w-5 text-gray-500" />;
      statusText = "Unknown Status";
      statusColorClass = "text-gray-700 bg-gray-100";
  }

  return (
    <div
      className={`flex items-center gap-2 p-3 rounded-md ${statusColorClass}`}
    >
      {icon}
      <span className="font-medium">{statusText}</span>
      {message && <p className="text-sm text-gray-600 mt-1">{message}</p>}
    </div>
  );
}