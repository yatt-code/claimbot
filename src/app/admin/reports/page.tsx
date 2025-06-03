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
import AdminLayout from '@/components/AdminLayout';
import { useRBAC } from '@/hooks/useRBAC';

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

  const { hasPermission } = useRBAC();

  // Check if user has permission to view reports
  if (!hasPermission('reports:read')) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-600 mb-2">Access Denied</h2>
            <p className="text-gray-500">You don&apos;t have permission to view reports.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📊 Reports & Export</h1>
          <p className="text-gray-600">Generate and export comprehensive reports</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
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

        {loading && (
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <p className="text-gray-600">Generating report data...</p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 p-6 rounded-lg border border-red-200">
            <p className="text-red-600">Error: {error}</p>
          </div>
        )}
        
        {!loading && !error && reportData.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold mb-4">Report Results</h2>
              <div className="flex gap-2">
                <Button variant="outline">Export as CSV</Button>
                <Button variant="outline">Export as PDF</Button>
              </div>
            </div>
            <div className="overflow-x-auto">
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
          </div>
        )}
        
        {!loading && !error && reportData.length === 0 && (
          <div className="bg-gray-50 p-6 rounded-lg border">
            <p className="text-gray-600 text-center">No report data available. Generate a report using the criteria above.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}