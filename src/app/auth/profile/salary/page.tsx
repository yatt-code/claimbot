"use client";

import StaffLayout from "@/components/StaffLayout";
import { SalarySubmissionForm } from "@/components/SalarySubmissionForm";
import { SalaryVerificationStatus } from "@/components/SalaryVerificationStatus";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type SalaryStatusType = "not_submitted" | "pending" | "verified" | "rejected";

interface UserProfile {
  salaryStatus: SalaryStatusType;
  salaryData?: {
    monthlySalary: number;
    hourlyRate: number;
  };
  salaryVerificationHistory?: Array<{
    status: SalaryStatusType;
    timestamp: string;
    notes?: string;
  }>;
}

export default function SalaryManagementPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/profile");
      if (!response.ok) {
        throw new Error("Failed to fetch user profile.");
      }
      const data: UserProfile = await response.json();
      setUserProfile(data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast.error("Failed to load salary data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const handleSalarySubmissionSuccess = () => {
    fetchUserProfile(); // Re-fetch profile after successful submission
  };

  if (isLoading) {
    return (
      <StaffLayout>
        <div className="flex justify-center items-center h-48">
          <p>Loading salary data...</p>
        </div>
      </StaffLayout>
    );
  }

  return (
    <StaffLayout>
      <h1 className="text-2xl font-bold mb-4">Salary Management</h1>

      {userProfile?.salaryStatus && (
        <div className="mb-6">
          <SalaryVerificationStatus
            status={userProfile.salaryStatus}
            message={
              userProfile.salaryStatus === "pending"
                ? "Your salary submission is pending verification."
                : userProfile.salaryStatus === "rejected"
                ? "Your previous salary submission was rejected. Please resubmit."
                : undefined
            }
          />
        </div>
      )}

      {userProfile?.salaryStatus === "verified" && userProfile.salaryData ? (
        <div className="mb-6 p-4 border rounded-md">
          <h2 className="text-xl font-semibold mb-2">Current Salary Details</h2>
          <p>
            <strong>Monthly Salary:</strong> ${userProfile.salaryData.monthlySalary.toFixed(2)}
          </p>
          <p>
            <strong>Hourly Rate:</strong> ${userProfile.salaryData.hourlyRate.toFixed(2)}
          </p>
        </div>
      ) : (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Submit Salary Details</h2>
          <SalarySubmissionForm onSubmissionSuccess={handleSalarySubmissionSuccess} />
        </div>
      )}

      {userProfile?.salaryVerificationHistory &&
        userProfile.salaryVerificationHistory.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-2">Verification History</h2>
            <div className="border rounded-md p-4">
              {userProfile.salaryVerificationHistory.map((entry, index) => (
                <div key={index} className="mb-4 pb-4 border-b last:border-b-0">
                  <p>
                    <strong>Status:</strong>{" "}
                    <span
                      className={`font-medium ${
                        entry.status === "verified"
                          ? "text-green-600"
                          : entry.status === "rejected"
                          ? "text-red-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {entry.status.replace(/_/g, " ")}
                    </span>
                  </p>
                  <p>
                    <strong>Date:</strong>{" "}
                    {new Date(entry.timestamp).toLocaleString()}
                  </p>
                  {entry.notes && (
                    <p>
                      <strong>Notes:</strong> {entry.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
    </StaffLayout>
  );
}