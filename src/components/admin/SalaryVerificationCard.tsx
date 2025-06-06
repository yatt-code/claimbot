import React from "react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

export interface SalaryVerificationRequest { // Export the interface
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  submittedMonthlySalary: number;
  submittedHourlyRate: number;
  submissionDate: string;
  status: "pending" | "verified" | "rejected";
  lastSalaryReviewYear?: number;
  canReviewSalary?: boolean;
  nextReviewYear?: number;
  history?: { action: string; date: string; by: string }[];
}

interface SalaryVerificationCardProps {
  request: SalaryVerificationRequest;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export function SalaryVerificationCard({
  request,
  onApprove,
  onReject,
}: SalaryVerificationCardProps) {
  const handleApproveClick = () => {
    onApprove(request.id);
  };

  const handleRejectClick = () => {
    onReject(request.id);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Salary Verification Request</CardTitle>
        <CardDescription>
          Request from {request.userName} ({request.userEmail})
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Monthly Salary:</p>
          <p className="text-sm">RM {request.submittedMonthlySalary?.toLocaleString()}</p>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Hourly Rate:</p>
          <p className="text-sm">RM {request.submittedHourlyRate?.toLocaleString()}</p>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Submission Date:</p>
          <p className="text-sm">{format(new Date(request.submissionDate), "PPP p")}</p>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Status:</p>
          <Badge
            variant={
              request.status === "pending"
                ? "secondary"
                : request.status === "verified" // Changed "approved" to "verified"
                ? "default"
                : "destructive"
            }
          >
            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
          </Badge>
        </div>

        {/* Annual Review Information */}
        <Separator className="my-2" />
        <h3 className="text-md font-semibold">Annual Review Information</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Review Year:</p>
            <p className="text-sm">{request.lastSalaryReviewYear || new Date().getFullYear()}</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Can Review Again:</p>
            <Badge variant={request.canReviewSalary ? "secondary" : "outline"}>
              {request.canReviewSalary ? "Yes" : "No"}
            </Badge>
          </div>
          {request.nextReviewYear && (
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Next Review Available:</p>
              <p className="text-sm">{request.nextReviewYear}</p>
            </div>
          )}
        </div>

        {request.history && request.history.length > 0 && (
          <>
            <Separator className="my-2" />
            <h3 className="text-md font-semibold">Verification History</h3>
            <div className="space-y-2">
              {request.history.map((entry, index) => (
                <div key={index} className="flex items-center justify-between text-sm text-gray-500">
                  <span>
                    {entry.action.charAt(0).toUpperCase() + entry.action.slice(1)} by {entry.by}
                  </span>
                  <span>{format(new Date(entry.date), "PPP p")}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        {request.status === "pending" && (
          <>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Approve</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Approval</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to approve this salary verification request?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button onClick={handleApproveClick}>Approve</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive">Reject</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Rejection</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to reject this salary verification request?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button variant="destructive" onClick={handleRejectClick}>
                    Reject
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </CardFooter>
    </Card>
  );
}