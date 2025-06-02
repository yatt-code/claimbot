// __tests__/frontend/SubmissionTable.test.tsx
import React from 'react';
import { render } from '@testing-library/react';
import SubmissionTable from '@/components/SubmissionTable'; // Adjust the import path if necessary
import mongoose from 'mongoose'; // Import mongoose for ObjectId

// Define interface for the combined data expected by SubmissionTable
interface ISubmissionTableItem {
  _id: string;
  userId: string;
  type: 'Expense' | 'Overtime'; // Discriminator field
  date: string; // Assuming date is formatted as string for display
  description?: string;
  amount?: number; // Optional for claims
  mileage?: number; // Optional for claims
  startTime?: string; // Optional for overtime
  endTime?: string; // Optional for overtime
  reason?: string; // Optional for overtime
  hoursWorked?: number; // Optional for overtime
  status: 'Draft' | 'Approved' | 'Rejected' | 'Pending'; // Combined status union
  submittedAt?: string; // Assuming date is formatted as string for display
  createdAt: string; // Assuming date is formatted as string for display
  updatedAt: string; // Assuming date is formatted as string for display
  total: number; // Common total field
}

// Mock data for testing
const mockSubmissions: ISubmissionTableItem[] = [
  {
    _id: new mongoose.Types.ObjectId().toString(), // Use ObjectId string
    userId: new mongoose.Types.ObjectId().toString(), // Use ObjectId string
    type: 'Expense', // Use capitalized type
    date: new Date('2023-10-01').toISOString(), // Format date as string
    amount: 100,
    status: 'Approved', // Use capitalized status
    description: 'Business trip expenses',
    createdAt: new Date('2023-10-01').toISOString(),
    updatedAt: new Date('2023-10-01').toISOString(),
    total: 100, // Add total field
  },
  {
    _id: new mongoose.Types.ObjectId().toString(), // Use ObjectId string
    userId: new mongoose.Types.ObjectId().toString(), // Use ObjectId string
    type: 'Overtime', // Use capitalized type
    date: new Date('2023-10-05').toISOString(), // Format date as string
    startTime: '18:00',
    endTime: '23:00',
    reason: 'Worked late on project deadline',
    hoursWorked: 5,
    status: 'Pending', // Use capitalized status
    createdAt: new Date('2023-10-05').toISOString(),
    updatedAt: new Date('2023-10-05').toISOString(),
    total: 5 * 1.5, // Calculate total (assuming a rate of 1.5)
  },
  // Add more mock data as needed
];

describe('SubmissionTable', () => {
  it('renders the table with submission data', () => {
    const { getByText } = render(<SubmissionTable submissions={mockSubmissions} />);

    // Check if table headers are present (assuming they exist in the component)
    expect(getByText(/Type/i)).toBeInTheDocument();
    expect(getByText(/Status/i)).toBeInTheDocument();
    expect(getByText(/Submission Date/i)).toBeInTheDocument();
    expect(getByText(/Description/i)).toBeInTheDocument();
    expect(getByText(/Amount\/Hours/i)).toBeInTheDocument(); // Check for combined header

    // Check for specific data from mock submissions
    expect(getByText(/Expense/i)).toBeInTheDocument(); // Check for capitalized type
    expect(getByText(/Approved/i)).toBeInTheDocument(); // Check for capitalized status
    expect(getByText(/100/i)).toBeInTheDocument(); // Check for claim amount
    expect(getByText(/Business trip expenses/i)).toBeInTheDocument();

    expect(getByText(/Overtime/i)).toBeInTheDocument(); // Check for capitalized type
    expect(getByText(/Pending/i)).toBeInTheDocument(); // Check for capitalized status
    expect(getByText(/5/i)).toBeInTheDocument(); // Check for overtime hours
    expect(getByText(/Worked late on project deadline/i)).toBeInTheDocument();
  });

  it('renders a message when there are no submissions', () => {
    const { getByText } = render(<SubmissionTable submissions={[]} />);

    // Assuming the component displays a specific message for empty state
    expect(getByText(/No submissions found/i)).toBeInTheDocument();
  });

  // TODO: Add tests for sorting, pagination, and other features if implemented
});