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
import { SalarySubmissionForm } from "@/components/SalarySubmissionForm";
import { SalaryVerificationStatus } from "@/components/SalaryVerificationStatus";
import { parseISO, isWeekend, getHours } from "date-fns";

type SalaryStatusType = "not_submitted" | "pending" | "verified" | "rejected";

interface UserProfile {
  salaryStatus: SalaryStatusType;
  monthlyOtHoursRemaining: number;
  salaryData?: {
    monthlySalary: number;
    hourlyRate: number;
  };
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
  const [salaryStatus, setSalaryStatus] = useState<SalaryStatusType | null>(null);
  const [monthlyOtHoursRemaining, setMonthlyOtHoursRemaining] = useState<number | null>(null);
  const [isLoadingSalaryStatus, setIsLoadingSalaryStatus] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const response = await fetch("/api/auth/profile");
        if (!response.ok) {
          throw new Error("Failed to fetch user profile.");
        }
        const data: UserProfile = await response.json();
        setSalaryStatus(data.salaryStatus);
        setMonthlyOtHoursRemaining(data.monthlyOtHoursRemaining);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        toast.error("Failed to load user profile data.");
        setSalaryStatus("not_submitted"); // Default to not submitted on error
      } finally {
        setIsLoadingSalaryStatus(false);
      }
    }
    fetchUserProfile();
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

  const isFormDisabled = salaryStatus !== "verified";

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
          <p>Loading salary verification status...</p>
        </div>
      </StaffLayout>
    );
  }

  return (
    <StaffLayout>
      <h1 className="text-2xl font-bold mb-4">Submit Overtime</h1>

      {salaryStatus === "not_submitted" && (
        <div className="mb-6">
          <SalaryVerificationStatus status="not_submitted" message="Please submit your salary details to enable overtime submissions." />
          <div className="mt-4">
            <SalarySubmissionForm onSubmissionSuccess={() => setSalaryStatus("pending")} />
          </div>
        </div>
      )}

      {(salaryStatus === "pending" || salaryStatus === "rejected") && (
        <div className="mb-6">
          <SalaryVerificationStatus status={salaryStatus} message={salaryStatus === "pending" ? "Your salary submission is pending verification. Overtime submission is disabled." : "Your salary submission was rejected. Please resubmit or contact HR."} />
          {salaryStatus === "rejected" && (
            <div className="mt-4">
              <SalarySubmissionForm onSubmissionSuccess={() => setSalaryStatus("pending")} />
            </div>
          )}
        </div>
      )}

      {salaryStatus === "verified" && monthlyOtHoursRemaining !== null && (
        <div className="mb-4 text-lg font-medium">
          Monthly OT Hours Remaining: <span className="text-blue-600">{monthlyOtHoursRemaining}</span> hours
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${isFormDisabled ? "opacity-50 pointer-events-none" : ""}`}>
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
    </StaffLayout>
  );
}