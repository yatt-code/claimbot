import { z } from 'zod';

export const SalarySubmissionSchema = z.object({
  monthlySalary: z.number().min(0, "Monthly salary cannot be negative."),
  hourlyRate: z.number().min(0, "Hourly rate cannot be negative."),
}).refine(
  (data) => data.monthlySalary > 0 || data.hourlyRate > 0,
  {
    message: "Either monthly salary or hourly rate must be provided (greater than 0).",
    path: ["monthlySalary"], // This will show the error on the monthlySalary field
  }
);

export const SalaryVerificationSchema = z.object({
  status: z.enum(['verified', 'rejected'], {
    required_error: "Verification status is required.",
    invalid_type_error: "Verification status must be 'verified' or 'rejected'.",
  }),
  reason: z.string().optional(), // Reason for rejection
});