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
import { useState } from "react";

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

interface SalarySubmissionFormProps {
  onSubmissionSuccess?: () => void;
}

export function SalarySubmissionForm({
  onSubmissionSuccess,
}: SalarySubmissionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SalaryFormValues>({
    resolver: zodResolver(salaryFormSchema),
    defaultValues: {
      monthlySalary: 0,
      hourlyRate: 0,
    },
  });

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
        throw new Error(errorData.message || "Failed to submit salary data.");
      }

      toast.success("Salary data submitted successfully! Pending verification.");
      form.reset();
      onSubmissionSuccess?.();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "An unexpected error occurred."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
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
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Salary Data"}
        </Button>
      </form>
    </Form>
  );
}