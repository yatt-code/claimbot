"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle, Clock, AlertCircle } from "lucide-react";

const salaryFormSchema = z.object({
  monthlySalary: z.coerce
    .number()
    .min(0, { message: "Monthly salary cannot be negative." }),
  hourlyRate: z.coerce
    .number()
    .min(0, { message: "Hourly rate cannot be negative." }),
}).refine(
  (data) => data.monthlySalary > 0 || data.hourlyRate > 0,
  {
    message: "Please provide either monthly salary or hourly rate (must be greater than 0).",
    path: ["monthlySalary"],
  }
);

type SalaryFormValues = z.infer<typeof salaryFormSchema>;

interface SalaryStatus {
  status: string;
  monthlySalary?: number;
  hourlyRate?: number;
  submittedAt?: string;
  verifiedAt?: string;
  lastSalaryReviewYear?: number;
  canReviewSalary: boolean;
  nextReviewYear: number;
}

interface SalarySubmissionFormProps {
  onSubmissionSuccess?: () => void;
}

export function SalarySubmissionForm({
  onSubmissionSuccess,
}: SalarySubmissionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [salaryStatus, setSalaryStatus] = useState<SalaryStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<SalaryFormValues>({
    resolver: zodResolver(salaryFormSchema),
    defaultValues: {
      monthlySalary: 0,
      hourlyRate: 0,
    },
  });

  // Fetch salary status on component mount
  useEffect(() => {
    fetchSalaryStatus();
  }, []);

  async function fetchSalaryStatus() {
    try {
      const response = await fetch("/api/users/salary/status");
      if (response.ok) {
        const data = await response.json();
        setSalaryStatus(data);
        
        // Pre-populate form with existing values if available
        if (data.monthlySalary || data.hourlyRate) {
          form.reset({
            monthlySalary: data.monthlySalary || 0,
            hourlyRate: data.hourlyRate || 0,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching salary status:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function onSubmit(values: SalaryFormValues) {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/users/salary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit salary data.");
      }

      toast.success("Salary review submitted successfully! Pending verification.");
      setShowForm(false);
      await fetchSalaryStatus(); // Refresh status
      onSubmissionSuccess?.();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "An unexpected error occurred."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReviewSalary() {
    setShowForm(true);
  }

  function handleCancelReview() {
    setShowForm(false);
    form.reset({
      monthlySalary: salaryStatus?.monthlySalary || 0,
      hourlyRate: salaryStatus?.hourlyRate || 0,
    });
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading salary information...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!salaryStatus) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Failed to load salary information. Please refresh the page.
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusMessage = () => {
    if (salaryStatus.status === 'pending') {
      return {
        icon: <Clock className="h-5 w-5 text-yellow-500" />,
        title: "Salary Review Submitted",
        description: "Your salary review is pending admin verification.",
        color: "border-yellow-200 bg-yellow-50"
      };
    }
    
    if (salaryStatus.status === 'verified') {
      if (salaryStatus.canReviewSalary) {
        return {
          icon: <Calendar className="h-5 w-5 text-blue-500" />,
          title: "Annual Salary Review Available",
          description: "You can review and update your salary information for this year.",
          color: "border-blue-200 bg-blue-50"
        };
      } else {
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
          title: "Salary Reviewed This Year",
          description: `You have already reviewed your salary this year. Next review available in ${salaryStatus.nextReviewYear}.`,
          color: "border-green-200 bg-green-50"
        };
      }
    }
    
    if (salaryStatus.status === 'rejected') {
      return {
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
        title: "Salary Review Rejected",
        description: salaryStatus.canReviewSalary 
          ? "Your previous salary review was rejected. You can submit a new review."
          : "Your salary review was rejected. Please contact admin for assistance.",
        color: "border-red-200 bg-red-50"
      };
    }
    
    // not_submitted or default
    return {
      icon: <Calendar className="h-5 w-5 text-blue-500" />,
      title: "Salary Review Required",
      description: "Please submit your salary information for verification to access overtime features.",
      color: "border-blue-200 bg-blue-50"
    };
  };

  const statusInfo = getStatusMessage();

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <Card className={`${statusInfo.color} border-2`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {statusInfo.icon}
            {statusInfo.title}
          </CardTitle>
          <CardDescription className="text-sm">
            {statusInfo.description}
          </CardDescription>
        </CardHeader>
        
        {salaryStatus.status === 'verified' && (salaryStatus.monthlySalary || salaryStatus.hourlyRate) && (
          <CardContent>
            <div className="text-sm space-y-1">
              <p><strong>Current Information:</strong></p>
              {salaryStatus.monthlySalary && salaryStatus.monthlySalary > 0 && (
                <p>Monthly Salary: RM {salaryStatus.monthlySalary.toLocaleString()}</p>
              )}
              {salaryStatus.hourlyRate && salaryStatus.hourlyRate > 0 && (
                <p>Hourly Rate: RM {salaryStatus.hourlyRate.toLocaleString()}</p>
              )}
              {salaryStatus.lastSalaryReviewYear && (
                <p>Last Reviewed: {salaryStatus.lastSalaryReviewYear}</p>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Review Button or Form */}
      {!showForm ? (
        <div className="flex justify-center">
          <Button
            onClick={handleReviewSalary}
            disabled={!salaryStatus.canReviewSalary}
            size="lg"
            className="w-full max-w-md"
          >
            {salaryStatus.canReviewSalary ? "Review Salary" : "Review Not Available"}
          </Button>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Annual Salary Review</CardTitle>
            <CardDescription>
              Update your salary information for {new Date().getFullYear()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800 mb-2">
                    <strong>Instructions:</strong> Please provide either your monthly salary OR hourly rate (not both).
                    Full-time staff typically use monthly salary, while part-time staff use hourly rate.
                  </p>
                </div>
                
                <FormField
                  control={form.control}
                  name="monthlySalary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Salary (Full-time Staff)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 5000 (leave as 0 if using hourly rate)"
                          step="0.01"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hourlyRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hourly Rate (Part-time Staff)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 25 (leave as 0 if using monthly salary)"
                          step="0.01"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? "Submitting..." : "Submit Review"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleCancelReview}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}