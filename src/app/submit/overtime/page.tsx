"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import FileUploader from "@/components/FileUploader";
import { DatePicker } from "@/components/DatePicker";
import { TimePicker } from "@/components/TimePicker";
import StaffLayout from "@/components/StaffLayout";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { parseISO, isWeekend, getHours } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";

type SalaryStatusType = "not_submitted" | "pending" | "verified" | "rejected";

interface SalaryStatus {
  status: SalaryStatusType;
  monthlySalary?: number;
  hourlyRate?: number;
  submittedAt?: string;
  verifiedAt?: string;
  lastSalaryReviewYear?: number;
  canReviewSalary: boolean;
  nextReviewYear: number;
}

interface UserProfile {
  monthlyOtHoursRemaining: number;
}

// Define Zod schema for overtime form
const overtimeFormSchema = z
  .object({
    date: z.string().min(1, { message: "Date is required." }),
    startTime: z.string().min(1, { message: "Start time is required." }),
    endTime: z.string().min(1, { message: "End time is required." }),
    justification: z.string().min(1, { message: "Justification is required." }),
    attachments: z.any().optional(), // File handling
  })
  .superRefine((data, ctx) => {
    const selectedDate = parseISO(data.date);
    const startHour = getHours(parseISO(`2000-01-01T${data.startTime}:00`));
    const endHour = getHours(parseISO(`2000-01-01T${data.endTime}:00`));

    console.log('DEBUG: Overtime form validation:', {
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      isWeekend: isWeekend(selectedDate),
      startHour,
      endHour
    });

    // Weekday time restriction: BEFORE 8 PM (20:00) is not allowed
    if (!isWeekend(selectedDate) && startHour < 20) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Overtime on weekdays can only start after 8 PM (20:00).",
        path: ["startTime"],
      });
    }

    // Basic time validation: end time must be after start time
    if (startHour >= endHour) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End time must be after start time.",
        path: ["endTime"],
      });
    }
  });

type OvertimeFormValues = z.infer<typeof overtimeFormSchema>;

export default function SubmitOvertimePage() {
  const router = useRouter();
  const [salaryStatus, setSalaryStatus] = useState<SalaryStatus | null>(null);
  const [monthlyOtHoursRemaining, setMonthlyOtHoursRemaining] = useState<number | null>(null);
  const [isLoadingSalaryStatus, setIsLoadingSalaryStatus] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch salary status
        const salaryResponse = await fetch("/api/users/salary/status");
        if (salaryResponse.ok) {
          const salaryData: SalaryStatus = await salaryResponse.json();
          setSalaryStatus(salaryData);
        } else {
          throw new Error("Failed to fetch salary status.");
        }

        // Fetch user profile for OT hours
        const profileResponse = await fetch("/api/auth/profile");
        if (profileResponse.ok) {
          const profileData: UserProfile = await profileResponse.json();
          setMonthlyOtHoursRemaining(profileData.monthlyOtHoursRemaining);
        } else {
          throw new Error("Failed to fetch user profile.");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load user data.");
        setSalaryStatus({
          status: "not_submitted",
          canReviewSalary: true,
          nextReviewYear: new Date().getFullYear()
        });
      } finally {
        setIsLoadingSalaryStatus(false);
      }
    }
    fetchData();
  }, []);

  const form = useForm<OvertimeFormValues>({
    resolver: zodResolver(overtimeFormSchema),
    defaultValues: {
      date: "",
      startTime: "",
      endTime: "",
      justification: "",
      attachments: null,
    },
    mode: "onBlur", // Validate on blur for better UX
  });

  const isFormDisabled = !salaryStatus || salaryStatus.status !== "verified";

  async function onSubmit(values: OvertimeFormValues): Promise<void> {
    setIsSubmitting(true);
    const loadingToast = toast.loading("Submitting overtime request...");
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

    try {
      // 1. Submit Overtime Request
      const overtimeResponse = await fetch(`${baseUrl}/api/overtime`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!overtimeResponse.ok) {
        const errorData = await overtimeResponse.json();
        throw new Error(errorData.message || "Failed to submit overtime request.");
      }

      const overtime = await overtimeResponse.json();
      const overtimeId = overtime._id;

      // 2. Handle File Uploads
      const attachments = values.attachments as FileList | null;
      if (attachments && attachments.length > 0) {
        const uploadPromises = Array.from(attachments).map(async (file: File) => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("overtimeId", overtimeId); // Associate file with the created overtime

          const uploadResponse = await fetch(`${baseUrl}/api/files/upload`, {
            method: "POST",
            body: formData,
          });

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            throw new Error(errorData.message || `Failed to upload file: ${file.name}`);
          }
          return uploadResponse.json();
        });

        await Promise.all(uploadPromises);
      }

      toast.success("Overtime request submitted successfully!", { id: loadingToast });
      router.push("/my-submissions");

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast.error(`Submission failed: ${errorMessage}`, { id: loadingToast });
      console.error("Error submitting overtime request:", error);
    } finally {
      setIsSubmitting(false);
    }
  }


  if (isLoadingSalaryStatus) {
    return (
      <StaffLayout>
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading salary verification status...</span>
        </div>
      </StaffLayout>
    );
  }

  const getStatusCard = () => {
    if (!salaryStatus) return null;

    switch (salaryStatus.status) {
      case "not_submitted":
        return (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <AlertCircle className="h-5 w-5" />
                Salary Review Required
              </CardTitle>
              <CardDescription>
                You must complete your annual salary review before submitting overtime requests.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/auth/profile/salary">
                <Button className="w-full">Complete Salary Review</Button>
              </Link>
            </CardContent>
          </Card>
        );

      case "pending":
        return (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <Clock className="h-5 w-5" />
                Salary Review Pending
              </CardTitle>
              <CardDescription>
                Your salary review is pending admin verification. Overtime submissions are disabled until verification is complete.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-yellow-700">
                <p>Submitted: {salaryStatus.submittedAt ? new Date(salaryStatus.submittedAt).toLocaleDateString() : 'Unknown'}</p>
                <p className="mt-2">Please wait for admin approval or contact HR if you have questions.</p>
              </div>
            </CardContent>
          </Card>
        );

      case "rejected":
        return (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                Salary Review Rejected
              </CardTitle>
              <CardDescription>
                Your salary review was rejected. Please submit a new review or contact HR for assistance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {salaryStatus.canReviewSalary ? (
                <Link href="/auth/profile/salary">
                  <Button variant="destructive" className="w-full">Submit New Review</Button>
                </Link>
              ) : (
                <p className="text-sm text-red-700">
                  You have already submitted a review this year. Please contact HR for assistance.
                </p>
              )}
            </CardContent>
          </Card>
        );

      case "verified":
        return (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                Salary Verified - Overtime Available
              </CardTitle>
              <CardDescription>
                Your salary has been verified. You can now submit overtime requests.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {salaryStatus.monthlySalary && salaryStatus.monthlySalary > 0 && (
                  <div>
                    <span className="font-medium">Monthly Salary:</span>
                    <br />
                    RM {salaryStatus.monthlySalary.toLocaleString()}
                  </div>
                )}
                {salaryStatus.hourlyRate && salaryStatus.hourlyRate > 0 && (
                  <div>
                    <span className="font-medium">Hourly Rate:</span>
                    <br />
                    RM {salaryStatus.hourlyRate.toLocaleString()}
                  </div>
                )}
                {salaryStatus.verifiedAt && (
                  <div>
                    <span className="font-medium">Verified:</span>
                    <br />
                    {new Date(salaryStatus.verifiedAt).toLocaleDateString()}
                  </div>
                )}
                {monthlyOtHoursRemaining !== null && (
                  <div>
                    <span className="font-medium">OT Hours Remaining:</span>
                    <br />
                    <span className="text-lg font-bold text-green-700">{monthlyOtHoursRemaining} hours</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <StaffLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Submit Overtime Request</h1>
          <p className="text-gray-600 mt-2">
            Submit your overtime hours for approval and processing
          </p>
        </div>

        {/* Salary Status Card */}
        {getStatusCard()}

        {/* Overtime Form */}
        {salaryStatus?.status === "verified" && (
          <Card>
            <CardHeader>
              <CardTitle>Overtime Request Form</CardTitle>
              <CardDescription>
                Fill in the details for your overtime request
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="grid gap-2">
                        <FormLabel>Date</FormLabel>
                        <DatePicker field={field} label="Pick a date" disabled={isFormDisabled} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem className="grid gap-2">
                        <FormLabel>Start Time</FormLabel>
                        <TimePicker field={field} label="Start Time" disabled={isFormDisabled} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem className="grid gap-2">
                        <FormLabel>End Time</FormLabel>
                        <TimePicker field={field} label="End Time" disabled={isFormDisabled} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="justification"
                    render={({ field }) => (
                      <FormItem className="grid gap-2 md:col-span-2">
                        <FormLabel>Justification</FormLabel>
                        <FormControl>
                          <Textarea {...field} disabled={isFormDisabled} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="attachments"
                    render={({ field }) => (
                      <FormItem className="grid gap-2 md:col-span-2">
                        <FormControl>
                          <FileUploader id="attachments" label="Optional Proof" multiple field={field} disabled={isFormDisabled} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex space-x-4 mt-4 md:col-span-2">
                    <Button variant="secondary" type="button" disabled={isFormDisabled}>💾 Save Draft</Button>
                    <Button type="submit" disabled={isSubmitting || isFormDisabled}>🚀 Submit Request</Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
      </div>
    </StaffLayout>
  );
}