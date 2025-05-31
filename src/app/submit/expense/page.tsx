import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import FileUploader from "@/components/FileUploader";
import { DatePicker } from "@/components/DatePicker";
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
import toast from "react-hot-toast"; // Import toast
import { useRouter } from "next/navigation"; // Import useRouter
import { useState } from "react"; // Import useState

// TODO: Implement file uploader component enhancements (preview, removal)

// Define Zod schema for expense form
const expenseFormSchema = z.object({
  date: z.string().min(1, { message: "Date is required." }), // Assuming date is string for now, will adjust with date picker
  project: z.string().optional(),
  description: z.string().optional(),
  mileage: z.preprocess(
    (val) => val === '' || val === null || val === undefined ? undefined : Number(val),
    z.number().min(0, { message: "Mileage cannot be negative." }).optional()
  ),
  toll: z.preprocess(
    (val) => val === '' || val === null || val === undefined ? undefined : Number(val),
    z.number().min(0, { message: "Toll cannot be negative." }).optional()
  ),
  petrol: z.preprocess(
    (val) => val === '' || val === null || val === undefined ? undefined : Number(val),
    z.number().min(0, { message: "Petrol cannot be negative." }).optional()
  ),
  meal: z.preprocess(
    (val) => val === '' || val === null || val === undefined ? undefined : Number(val),
    z.number().min(0, { message: "Meal cannot be negative." }).optional()
  ),
  others: z.preprocess(
    (val) => val === '' || val === null || val === undefined ? undefined : Number(val),
    z.number().min(0, { message: "Others cannot be negative." }).optional()
  ),
  // attachments: z.any().optional(), // File handling will be separate
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;


export default function SubmitExpensePage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<ExpenseFormValues, any, ExpenseFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(expenseFormSchema) as any,
    defaultValues: {
      date: "",
      project: "",
      description: "",
      mileage: 0,
      toll: 0,
      petrol: 0,
      meal: 0,
      others: 0,
    },
  });

  const router = useRouter(); // Initialize useRouter
  const [isSubmitting, setIsSubmitting] = useState(false); // State for submission loading
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null); // State for selected files

  const handleFileChange = (files: FileList | null) => {
    setSelectedFiles(files);
  };

  async function onSubmit(values: ExpenseFormValues): Promise<void> {
    setIsSubmitting(true);
    const loadingToast = toast.loading("Submitting expense claim...");
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

    try {
      // 1. Submit Expense Claim
      const claimResponse = await fetch(`${baseUrl}/api/claims`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!claimResponse.ok) {
        const errorData = await claimResponse.json();
        throw new Error(errorData.message || "Failed to submit expense claim.");
      }

      const claim = await claimResponse.json();
      const claimId = claim._id;

      // 2. Handle File Uploads
      if (selectedFiles && selectedFiles.length > 0) {
        const uploadPromises = Array.from(selectedFiles).map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("claimId", claimId); // Associate file with the created claim

          const uploadResponse = await fetch(`${baseUrl}/api/files/upload`, {
            method: "POST",
            body: formData,
            // Note: Do not set Content-Type header for FormData
          });

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            throw new Error(errorData.message || `Failed to upload file: ${file.name}`);
          }
          return uploadResponse.json();
        });

        await Promise.all(uploadPromises);
      }

      toast.success("Expense claim submitted successfully!", { id: loadingToast });
      router.push("/my-submissions"); // Redirect to my submissions page

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast.error(`Submission failed: ${errorMessage}`, { id: loadingToast });
      console.error("Error submitting expense claim:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">📥 Expense Claim Form</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="grid gap-2">
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <DatePicker field={field} label="Pick a date" /> {/* Use DatePicker component */}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="project"
            render={({ field }) => (
              <FormItem className="grid gap-2">
                <FormLabel>Project</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="grid gap-2 md:col-span-2">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mileage"
            render={({ field }) => (
              <FormItem className="grid gap-2">
                <FormLabel>Mileage (km)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : Number(e.target.value);
                      field.onChange(value);
                    }}
                    value={field.value === null || field.value === undefined ? '' : field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="toll"
            render={({ field }) => (
              <FormItem className="grid gap-2">
                <FormLabel>Toll</FormLabel>
                <FormControl>
                   <Input
                    type="number"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : Number(e.target.value);
                      field.onChange(value);
                    }}
                    value={field.value === null || field.value === undefined ? '' : field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="petrol"
            render={({ field }) => (
              <FormItem className="grid gap-2">
                <FormLabel>Petrol</FormLabel>
                <FormControl>
                   <Input
                    type="number"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : Number(e.target.value);
                      field.onChange(value);
                    }}
                    value={field.value === null || field.value === undefined ? '' : field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="meal"
            render={({ field }) => (
              <FormItem className="grid gap-2">
                <FormLabel>Meal</FormLabel>
                <FormControl>
                   <Input
                    type="number"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : Number(e.target.value);
                      field.onChange(value);
                    }}
                    value={field.value === null || field.value === undefined ? '' : field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="others"
            render={({ field }) => (
              <FormItem className="grid gap-2">
                <FormLabel>Others</FormLabel>
                <FormControl>
                   <Input
                    type="number"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : Number(e.target.value);
                      field.onChange(value);
                    }}
                    value={field.value === null || field.value === undefined ? '' : field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-2 md:col-span-2">
            <FileUploader id="attachments" label="Attachments" multiple onChange={handleFileChange} />
          </div>

          <div className="flex space-x-4 mt-4 md:col-span-2">
            {/* TODO: Implement Save as Draft functionality */}
            <Button variant="secondary" type="button">💾 Save as Draft</Button>
            <Button type="submit" disabled={isSubmitting}>🚀 Submit Claim</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}