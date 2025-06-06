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
import { useState } from "react";

// TODO: Implement file uploader component enhancements (preview, removal)

// Define Zod schema for overtime form
const overtimeFormSchema = z.object({
  date: z.string().min(1, { message: "Date is required." }),
  startTime: z.string().min(1, { message: "Start time is required." }),
  endTime: z.string().min(1, { message: "End time is required." }),
  justification: z.string().min(1, { message: "Justification is required." }),
  attachments: z.any().optional(), // File handling
});

type OvertimeFormValues = z.infer<typeof overtimeFormSchema>;

export default function SubmitOvertimePage() {
  const form = useForm<OvertimeFormValues>({
    resolver: zodResolver(overtimeFormSchema),
    defaultValues: {
      date: "",
      startTime: "",
      endTime: "",
      justification: "",
      attachments: null,
    },
  });

  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  return (
    <StaffLayout>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="grid gap-2">
                <FormLabel>Date</FormLabel>
                <DatePicker field={field} label="Pick a date" /> {/* Use DatePicker component */}
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
                <TimePicker field={field} label="Start Time" /> {/* Use TimePicker component */}
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
                <TimePicker field={field} label="End Time" /> {/* Use TimePicker component */}
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
                  <Textarea {...field} />
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
                  <FileUploader id="attachments" label="Optional Proof" multiple field={field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex space-x-4 mt-4 md:col-span-2">
            {/* TODO: Implement Save as Draft functionality */}
            <Button variant="secondary" type="button">💾 Save Draft</Button>
            <Button type="submit" disabled={isSubmitting}>🚀 Submit Request</Button>
          </div>
        </form>
      </Form>
    </StaffLayout>
  );
}