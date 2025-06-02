// __tests__/frontend/admin/reports/page.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReportsPage from '@/app/admin/reports/page'; // Adjust the import path if necessary
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock form components or relevant parts if needed, but let's assume standard HTML elements for now
// Mock the Table component or relevant parts if needed

describe('Admin Reports Page', () => {
  const mockPush = jest.fn();
  const mockReportData = [
    { _id: 'sub1', type: 'Claim', status: 'Approved', amount: 100, submissionDate: '2023-10-01T00:00:00.000Z' },
    { _id: 'sub2', type: 'Overtime', status: 'Pending', hours: 5, submissionDate: '2023-10-05T00:00:00.000Z' },
  ];

  beforeEach(() => {
    // Reset mocks before each test
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    toast.success = jest.fn();
    toast.error = jest.fn();
    global.fetch = jest.fn() as jest.Mock; // Cast global.fetch to jest.Mock
  });

  it('renders the page with report criteria form', () => {
    render(<ReportsPage />);

    // Check for report criteria form elements (adjust based on actual form structure)
    expect(screen.getByLabelText(/Start Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/End Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/User/i)).toBeInTheDocument(); // Assuming a user select/input
    expect(screen.getByLabelText(/Status/i)).toBeInTheDocument(); // Assuming a status select/input
    expect(screen.getByRole('button', { name: /Generate Report/i })).toBeInTheDocument();
  });

  it('fetches and displays report data based on criteria', async () => {
    // Mock successful fetch response for report data
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockReportData),
    } as Response);

    const { getByLabelText, getByRole } = render(<ReportsPage />);

    // Fill in report criteria (adjust based on form structure and input types)
    await userEvent.type(getByLabelText(/Start Date/i), '2023-10-01');
    await userEvent.type(getByLabelText(/End Date/i), '2023-10-31');
    // Assuming user and status are select inputs, interaction would be different
    // await userEvent.selectOptions(getByLabelText(/User/i), 'user123');
    // await userEvent.selectOptions(getByLabelText(/Status/i), 'Approved');

    // Click the Generate Report button
    await userEvent.click(getByRole('button', { name: /Generate Report/i }));

    // Wait for data fetching to complete
    await waitFor(() => {
      // Check if fetch was called with the correct endpoint and query parameters
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/reports?startDate=2023-10-01&endDate=2023-10-31', // Adjust endpoint and params
        expect.objectContaining({
          method: 'GET',
        })
      );

      // Check if report data is displayed (adjust based on how report results are rendered)
      expect(screen.getByText(/Claim/i)).toBeInTheDocument();
      expect(screen.getByText(/Approved/i)).toBeInTheDocument();
      expect(screen.getByText(/100/i)).toBeInTheDocument();
      expect(screen.getByText(/Overtime/i)).toBeInTheDocument();
      expect(screen.getByText(/Pending/i)).toBeInTheDocument();
      expect(screen.getByText(/5/i)).toBeInTheDocument();
    });
  });

  it('handles no report data found for criteria', async () => {
    // Mock successful fetch response with an empty array
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    } as Response);

    const { getByRole } = render(<ReportsPage />);

    // Click the Generate Report button (assuming no criteria filled for this test)
    await userEvent.click(getByRole('button', { name: /Generate Report/i }));

    // Wait for data fetching to complete
    await waitFor(() => {
      // Check if a "no data found" message is displayed (adjust based on component)
      // expect(screen.getByText(/No report data found for the selected criteria/i)).toBeInTheDocument(); // Adjust message
      // Or check that the report results area is empty
    });
  });

  it('handles fetch errors during report generation', async () => {
    // Mock failed fetch response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    // Mock console.error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { getByRole } = render(<ReportsPage />);

    // Click the Generate Report button
    await userEvent.click(getByRole('button', { name: /Generate Report/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
         expect.stringContaining('/api/reports'), // Check for the reports endpoint
         expect.objectContaining({ method: 'GET' })
      );
      expect(consoleErrorSpy).toHaveBeenCalled(); // Check error logging
      // Check for error message display
      // expect(screen.getByText(/Error generating report/i)).toBeInTheDocument(); // Adjust message
    });

    consoleErrorSpy.mockRestore();
  });


  // TODO: Add tests for export functionality if implemented
  // TODO: Test loading state
  // TODO: Add tests for different criteria combinations
});