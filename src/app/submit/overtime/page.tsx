import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import FileUploader from "@/components/FileUploader";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// TODO: Implement date picker component
// TODO: Implement time range picker component
// TODO: Implement form handling with react-hook-form and Zod

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// TODO: Implement date picker component
// TODO: Implement time range picker component
// TODO: Implement file uploader component enhancements (preview, removal)
// TODO: Handle file uploads separately after overtime submission

// Define Zod schema for overtime form
const overtimeFormSchema = z.object({
  date: z.string().min(1, { message: "Date is required." }), // Assuming date is string for now, will adjust with date picker
  startTime: z.string().min(1, { message: "Start time is required." }), // Assuming time is string for now, will adjust with time picker
  endTime: z.string().min(1, { message: "End time is required." }), // Assuming time is string for now, will adjust with time picker
  justification: z.string().min(1, { message: "Justification is required." }),
  // attachments: z.any().optional(), // File handling will be separate
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
    },
  });

  // TODO: Handle file uploads separately
  const handleFileChange = (files: FileList | null) => {
    console.log("Selected files:", files);
    // Implement file handling logic here
  };

  async function onSubmit(values: OvertimeFormValues): Promise<void> {
    console.log("Form submitted:", values);
    // TODO: Implement actual API call to submit overtime request
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    try {
      const response = await fetch(`${baseUrl}/api/overtime`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        console.log("Overtime request submitted successfully!");
        // TODO: Redirect to my submissions page or show success message
      } else {
        console.error("Failed to submit overtime request:", response.statusText);
        // TODO: Show error message to user
      }
    } catch (error) {
      console.error("Error submitting overtime request:", error);
      // TODO: Show error message to user
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">⏱️ Overtime Request</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="grid gap-2">
                <FormLabel>Date</FormLabel>
                <FormControl>
                  {/* TODO: Date Picker Component */}
                  <Input type="date" {...field} />
                </FormControl>
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
                <FormControl>
                  {/* TODO: Time Range Picker Component */}
                  <Input type="time" {...field} />
                </FormControl>
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
                <FormControl>
                  {/* TODO: Time Range Picker Component */}
                  <Input type="time" {...field} />
                </FormControl>
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

          <div className="grid gap-2 md:col-span-2">
            <FileUploader id="attachments" label="Optional Proof" multiple onChange={handleFileChange} />
          </div>

          <div className="flex space-x-4 mt-4 md:col-span-2">
            {/* TODO: Implement Save as Draft functionality */}
            <Button variant="secondary" type="button">💾 Save Draft</Button>
            <Button type="submit">🚀 Submit Request</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}