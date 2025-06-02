'use client'; // This is a client component

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'react-hot-toast'; // Assuming react-hot-toast for notifications
import { format } from 'date-fns'; // For date formatting
import { CalendarIcon } from '@radix-ui/react-icons'; // Assuming radix-ui icons
import { cn } from '@/lib/utils'; // Assuming utility function for class names
import { Button } from '@/components/ui/button'; // Assuming shadcn Button component
import { Calendar } from '@/components/ui/calendar'; // Assuming shadcn Calendar component
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'; // Assuming shadcn Popover components
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Assuming shadcn Select components
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'; // Assuming shadcn Table components

// Define the schema for report criteria validation
const reportCriteriaSchema = z.object({
  startDate: z.date({
    required_error: "Start date is required.",
  }),
  endDate: z.date({
    required_error: "End date is required.",
  }),
  reportType: z.enum(['all', 'claims', 'overtime'], {
    errorMap: () => ({ message: "Please select a report type." }),
  }),
  // Add other criteria like user, status, etc. later if needed
});

type ReportCriteriaFormData = z.infer<typeof reportCriteriaSchema>;

// Define a generic interface for report data rows
interface ReportRow {
  _id: string;
  user: string; // User name
  type: string; // 'Claim' or 'Overtime'
  date: string; // Formatted date
  status: string;
  description?: string; // For claims
  justification?: string; // For overtime
  total?: number; // Claim total or overtime payout
  // Add other common fields
}


export default function AdminReportsPage() {
  const [reportData, setReportData] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ReportCriteriaFormData>({
    resolver: zodResolver(reportCriteriaSchema),
    defaultValues: {
      reportType: 'all',
    },
  });

  const onSubmit = async (data: ReportCriteriaFormData) => {
    setLoading(true);
    setError(null);
    setReportData([]); // Clear previous results

    const loadingToast = toast.loading('Generating report...');

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
      // Assuming a backend route like /api/reports that accepts query parameters
      const queryParams = new URLSearchParams({
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
        reportType: data.reportType,
        // Add other criteria here
      }).toString();

      const response = await fetch(`${baseUrl}/api/reports?${queryParams}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate report.');
      }

      const reportResults: ReportRow[] = await response.json(); // Assuming backend returns mapped data
      setReportData(reportResults);
      toast.success('Report generated successfully!', { id: loadingToast });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      toast.error(`Failed to generate report: ${errorMessage}`, { id: loadingToast });
      console.error("Error generating report:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">📊 Reports & Export</h1>

      <div className="bg-white p-6 rounded shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Report Criteria</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="flex flex-col space-y-2">
            <label htmlFor="startDate" className="text-gray-700 font-bold">Start Date:</label>
            <Controller
              name="startDate"
              control={control}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            {errors.startDate && <p className="text-red-500 text-xs italic">{errors.startDate.message}</p>}
          </div>

          <div className="flex flex-col space-y-2">
            <label htmlFor="endDate" className="text-gray-700 font-bold">End Date:</label>
            <Controller
              name="endDate"
              control={control}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            {errors.endDate && <p className="text-red-500 text-xs italic">{errors.endDate.message}</p>}
          </div>

          <div className="flex flex-col space-y-2">
            <label htmlFor="reportType" className="text-gray-700 font-bold">Report Type:</label>
            <Controller
              name="reportType"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger className={`w-full ${errors.reportType ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Submissions</SelectItem>
                    <SelectItem value="claims">Claims</SelectItem>
                    <SelectItem value="overtime">Overtime</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.reportType && <p className="text-red-500 text-xs italic">{errors.reportType.message}</p>}
          </div>

          <div className="md:col-span-3 flex justify-end">
            <Button type="submit" disabled={isSubmitting || loading}>
              {isSubmitting || loading ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </form>
      </div>

      {loading && <p>Generating report data...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {!loading && !error && reportData.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Report Results</h2>
          {/* Placeholder for export buttons */}
          <div className="mb-4">
            <Button variant="outline" className="mr-2">Export as CSV</Button>
            <Button variant="outline">Export as PDF</Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Description/Justification</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map(row => (
                <TableRow key={row._id}>
                  <TableCell>{row.date}</TableCell>
                  <TableCell>{row.user}</TableCell>
                  <TableCell>{row.type}</TableCell>
                  <TableCell>{row.status}</TableCell>
                  <TableCell>{row.description || row.justification || '-'}</TableCell>
                  <TableCell>{row.total !== undefined ? row.total.toFixed(2) : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
       {!loading && !error && reportData.length === 0 && (
           <p>No report data available. Generate a report using the criteria above.</p>
       )}
    </div>
  );
}