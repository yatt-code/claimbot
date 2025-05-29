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
// TODO: Implement file uploader component

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// TODO: Implement date picker component
// TODO: Implement file uploader component enhancements (preview, removal)
// TODO: Handle file uploads separately after claim submission

// Define Zod schema for expense form
const expenseFormSchema = z.object({
  date: z.string().min(1, { message: "Date is required." }), // Assuming date is string for now, will adjust with date picker
  project: z.string().optional(),
  description: z.string().optional(),
  mileage: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.coerce.number().min(0, { message: "Mileage cannot be negative." }).optional()
  ),
  toll: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.coerce.number().min(0, { message: "Toll cannot be negative." }).optional()
  ),
  petrol: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.coerce.number().min(0, { message: "Petrol cannot be negative." }).optional()
  ),
  meal: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.coerce.number().min(0, { message: "Meal cannot be negative." }).optional()
  ),
  others: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.coerce.number().min(0, { message: "Others cannot be negative." }).optional()
  ),
  // attachments: z.any().optional(), // File handling will be separate
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

export default function SubmitExpensePage() {
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
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

  // TODO: Handle file uploads separately
  const handleFileChange = (files: FileList | null) => {
    console.log("Selected files:", files);
    // Implement file handling logic here
  };

  async function onSubmit(values: ExpenseFormValues) {
    console.log("Form submitted:", values);
    // TODO: Implement actual API call to submit expense claim
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/claims`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        console.log("Expense claim submitted successfully!");
        // TODO: Redirect to my submissions page or show success message
      } else {
        console.error("Failed to submit expense claim:", response.statusText);
        // TODO: Show error message to user
      }
    } catch (error) {
      console.error("Error submitting expense claim:", error);
      // TODO: Show error message to user
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
                  {/* TODO: Date Picker Component */}
                  <Input type="date" {...field} />
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
            <Button type="submit">🚀 Submit Claim</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}