// __tests__/frontend/manager/approvals/page.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ApprovalsPage from '@/app/manager/approvals/page'; // Adjust the import path if necessary
import { useRouter } from 'next/navigation';
import PendingSubmissionsList from '@/components/PendingSubmissionsList'; // Assuming PendingSubmissionsList is used

// Define interface for mock submission data
interface MockSubmission {
  _id: string;
  description: string;
  status: string;
  // Add other relevant fields for the mock if needed
}

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock the PendingSubmissionsList component
jest.mock('@/components/PendingSubmissionsList', () => ({
  __esModule: true,
  default: jest.fn(({ submissions }: { submissions: MockSubmission[] }) => (
    <div data-testid="pending-submissions-list">
      {submissions.length > 0 ? (
        <ul>
          {submissions.map((submission) => (
            <li key={submission._id}>{submission.description} - {submission.status}</li>
          ))}
        </ul>
      ) : (
        <p>No pending submissions found.</p>
      )}
    </div>
  )),
}));


describe('Manager Approvals Page', () => {
  const mockPush = jest.fn();
  beforeEach(() => {
    // Reset mocks before each test
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (PendingSubmissionsList as jest.Mock).mockClear(); // Clear mock calls for PendingSubmissionsList
    // Mock fetch for data fetching
    global.fetch = jest.fn() as jest.Mock; // Cast global.fetch to jest.Mock
  });

  it('renders the page and fetches pending submissions', async () => {
    // Mock a successful fetch response with dummy data
    const mockSubmissions: MockSubmission[] = [
      { _id: 'sub1', description: 'Claim 1', status: 'Pending' },
      { _id: 'sub2', description: 'Overtime 1', status: 'Pending' },
    ];
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSubmissions),
    } as Response);

    render(<ApprovalsPage />);

    // Check if the PendingSubmissionsList component is rendered
    expect(screen.getByTestId('pending-submissions-list')).toBeInTheDocument();

    // Wait for the data to be fetched and the component to update
    await waitFor(() => {
      // Check if fetch was called with the correct endpoint
      expect(global.fetch).toHaveBeenCalledWith('/api/submissions/pending'); // Adjust endpoint if necessary
      // Check if PendingSubmissionsList was called with the fetched data
      expect(PendingSubmissionsList).toHaveBeenCalledWith(
        expect.objectContaining({
          submissions: mockSubmissions,
        }),
        {}
      );
    });
  });

  it('renders a message when no pending submissions are found', async () => {
    // Mock a successful fetch response with an empty array
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    } as Response);

    render(<ApprovalsPage />);

    // Wait for the data to be fetched
    await waitFor(() => {
      // Check if the "No pending submissions found" message is displayed by the mock component
      expect(screen.getByText(/No pending submissions found/i)).toBeInTheDocument();
      // Check if PendingSubmissionsList was called with an empty array
      expect(PendingSubmissionsList).toHaveBeenCalledWith(
        expect.objectContaining({
          submissions: [],
        }),
        {}
      );
    });
  });

  it('handles fetch errors', async () => {
    // Mock a failed fetch response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    // Mock console.error to check if errors are logged
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<ApprovalsPage />);

    // Wait for the fetch to complete (and likely log an error)
    await waitFor(() => {
      // Check if fetch was called
      expect(global.fetch).toHaveBeenCalledWith('/api/submissions/pending'); // Adjust endpoint if necessary
      // Check if an error was logged (adjust based on actual error handling)
      expect(consoleErrorSpy).toHaveBeenCalled(); // Or check for a specific error message in the log
      // Check that PendingSubmissionsList was NOT called with data
      expect(PendingSubmissionsList).not.toHaveBeenCalledWith(
        expect.objectContaining({
          submissions: expect.any(Array),
        }),
        {}
      );
      // Check if a user-facing error message is displayed (if the component does that)
      // expect(screen.getByText(/Error fetching submissions/i)).toBeInTheDocument(); // Adjust message if necessary
    });

    consoleErrorSpy.mockRestore(); // Restore console.error
  });

  // TODO: Add tests for navigation to submission detail page
});