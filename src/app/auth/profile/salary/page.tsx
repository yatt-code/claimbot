"use client";

import StaffLayout from "@/components/StaffLayout";
import { SalarySubmissionForm } from "@/components/SalarySubmissionForm";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type SalaryStatusType = "not_submitted" | "pending" | "verified" | "rejected";

interface SalaryStatus {
  status: SalaryStatusType;
  monthlySalary?: number;
  hourlyRate?: number;
  submittedAt?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  lastSalaryReviewYear?: number;
  canReviewSalary: boolean;
  nextReviewYear: number;
}

export default function SalaryManagementPage() {
  const [salaryStatus, setSalaryStatus] = useState<SalaryStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSalaryStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/users/salary/status");
      if (!response.ok) {
        throw new Error("Failed to fetch salary status.");
      }
      const data: SalaryStatus = await response.json();
      setSalaryStatus(data);
    } catch (error) {
      console.error("Error fetching salary status:", error);
      toast.error("Failed to load salary data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaryStatus();
  }, []);

  const handleSalarySubmissionSuccess = () => {
    fetchSalaryStatus(); // Re-fetch status after successful submission
  };

  if (isLoading) {
    return (
      <StaffLayout>
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading salary information...</span>
        </div>
      </StaffLayout>
    );
  }

  if (!salaryStatus) {
    return (
      <StaffLayout>
        <div className="text-center text-red-600 p-8">
          Failed to load salary information. Please refresh the page.
        </div>
      </StaffLayout>
    );
  }

  return (
    <StaffLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Annual Salary Review</h1>
          <p className="text-gray-600 mt-2">
            Manage your annual salary review and verification status
          </p>
        </div>

        {/* Main Salary Review Form/Status */}
        <SalarySubmissionForm onSubmissionSuccess={handleSalarySubmissionSuccess} />

        {/* Current Salary Information (if verified) */}
        {salaryStatus.status === "verified" && (salaryStatus.monthlySalary || salaryStatus.hourlyRate) && (
          <Card>
            <CardHeader>
              <CardTitle>Current Verified Salary Information</CardTitle>
              <CardDescription>
                Your salary information as verified by administration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {salaryStatus.monthlySalary && salaryStatus.monthlySalary > 0 && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h3 className="font-semibold text-green-800">Monthly Salary</h3>
                    <p className="text-2xl font-bold text-green-900">
                      RM {salaryStatus.monthlySalary.toLocaleString()}
                    </p>
                  </div>
                )}
                {salaryStatus.hourlyRate && salaryStatus.hourlyRate > 0 && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-blue-800">Hourly Rate</h3>
                    <p className="text-2xl font-bold text-blue-900">
                      RM {salaryStatus.hourlyRate.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                  {salaryStatus.submittedAt && (
                    <div>
                      <span className="font-medium">Submitted:</span>
                      <br />
                      {new Date(salaryStatus.submittedAt).toLocaleDateString()}
                    </div>
                  )}
                  {salaryStatus.verifiedAt && (
                    <div>
                      <span className="font-medium">Verified:</span>
                      <br />
                      {new Date(salaryStatus.verifiedAt).toLocaleDateString()}
                    </div>
                  )}
                  {salaryStatus.lastSalaryReviewYear && (
                    <div>
                      <span className="font-medium">Review Year:</span>
                      <br />
                      {salaryStatus.lastSalaryReviewYear}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Review Cycle Information */}
        <Card>
          <CardHeader>
            <CardTitle>Annual Review Cycle</CardTitle>
            <CardDescription>
              Understanding your salary review schedule
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-800">Current Year</h4>
                  <p className="text-xl font-bold text-gray-900">
                    {new Date().getFullYear()}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-800">Next Review Available</h4>
                  <p className="text-xl font-bold text-gray-900">
                    {salaryStatus.nextReviewYear}
                  </p>
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">Review Policy</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Staff can review and update their salary once per calendar year</li>
                  <li>• All salary reviews require administrative verification</li>
                  <li>• Verified salary information is required to access overtime features</li>
                  <li>• Review eligibility resets each January 1st</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </StaffLayout>
  );
}