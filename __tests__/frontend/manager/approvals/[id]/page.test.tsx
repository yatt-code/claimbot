// __tests__/frontend/manager/approvals/[id]/page.test.tsx
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SubmissionDetailPage from '@/app/manager/approvals/[id]/page'; // Adjust the import path if necessary
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import AttachmentViewer from '@/components/AttachmentViewer'; // Assuming AttachmentViewer is used
import ActionButtons from '@/components/ActionButtons'; // Assuming ActionButtons is used

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

// Mock child components
// Manually create a mock for SubmissionDetails
const mockSubmissionDetails = jest.fn(({ submission }) => (
  <div data-testid="submission-detail-card">
    <p>Submission Type: {submission?.type}</p>
    <p>Status: {submission?.status}</p>
    {/* Add other relevant details from submission */}
  </div>
));

jest.mock('@/components/SubmissionDetailCard', () => ({
  __esModule: true,
  SubmissionDetails: mockSubmissionDetails, // Use the manually created mock
}));

jest.mock('@/components/AttachmentViewer', () => ({
  __esModule: true,
  default: jest.fn(({ attachments }) => (
    <div data-testid="attachment-viewer">
      <p>Attachments: {attachments?.length || 0}</p>
      {/* Add display for attachment names if needed */}
    </div>
  )),
}));

jest.mock('@/components/ActionButtons', () => ({
  __esModule: true,
  default: jest.fn(({ submissionId, onApprove, onReject, onAddComment }) => (
    <div data-testid="action-buttons">
      <button onClick={() => onApprove(submissionId)}>Approve</button>
      <button onClick={() => onReject(submissionId)}>Reject</button>
      <button onClick={() => onAddComment(submissionId, 'Test Comment')}>Add Comment</button>
    </div>
  )),
}));


describe('Manager Submission Detail Page', () => {
  const mockPush = jest.fn();
  const submissionId = 'test-submission-id';
  const mockSubmission = {
    _id: submissionId,
    type: 'Claim',
    status: 'Pending',
    description: 'Test Claim',
    // Add other relevant submission fields
  };
  const mockAttachments = [{ _id: 'att1', filename: 'file1.pdf' }];

  beforeEach(() => {
    // Reset mocks before each test
    (useRouter as jest.Mock).mockReturnValue({ query: { id: submissionId }, push: mockPush });
    toast.success = jest.fn();
    toast.error = jest.fn();
    (mockSubmissionDetails as jest.Mock).mockClear();
    (AttachmentViewer as jest.Mock).mockClear();
    (ActionButtons as jest.Mock).mockClear();
    global.fetch = jest.fn() as jest.Mock; // Cast global.fetch to jest.Mock
  });

  it('renders the page and fetches submission details and attachments', async () => {
    // Mock successful fetch responses
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ // Mock fetch for submission details
        ok: true,
        json: () => Promise.resolve(mockSubmission),
      } as Response)
      .mockResolvedValueOnce({ // Mock fetch for attachments
        ok: true,
        json: () => Promise.resolve(mockAttachments),
      } as Response);

    render(<SubmissionDetailPage params={{ id: submissionId }} />);

    // Wait for data fetching to complete
    await waitFor(() => {
      // Check if fetch was called for submission details
      expect(global.fetch).toHaveBeenCalledWith(`/api/submissions/${submissionId}`); // Adjust endpoint if necessary
      // Check if fetch was called for attachments
      expect(global.fetch).toHaveBeenCalledWith(`/api/files/submission/${submissionId}`); // Adjust endpoint if necessary

      // Check if child components were called with the correct data
      expect(mockSubmissionDetails).toHaveBeenCalledWith(
        expect.objectContaining({
          submission: mockSubmission,
        }),
        {}
      );
      expect(AttachmentViewer).toHaveBeenCalledWith(
        expect.objectContaining({
          attachments: mockAttachments,
        }),
        {}
      );
      expect(ActionButtons).toHaveBeenCalledWith(
        expect.objectContaining({
          submissionId: submissionId,
          onApprove: expect.any(Function),
          onReject: expect.any(Function),
          onAddComment: expect.any(Function),
        }),
        {}
      );
    });
  });

  it('handles submission not found', async () => {
    // Mock fetch response for submission details indicating not found
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response);

    // Mock console.error to check if errors are logged
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<SubmissionDetailPage params={{ id: submissionId }} />);

    // Wait for fetch to complete
    await waitFor(() => {
      // Check if fetch was called
      expect(global.fetch).toHaveBeenCalledWith(`/api/submissions/${submissionId}`); // Adjust endpoint if necessary
      // Check if an error was logged (adjust based on actual error handling)
      expect(consoleErrorSpy).toHaveBeenCalled(); // Or check for a specific error message

      // Check if a "not found" message is displayed or user is redirected
      // expect(screen.getByText(/Submission not found/i)).toBeInTheDocument(); // Adjust message if necessary
      // expect(mockPush).toHaveBeenCalledWith('/manager/approvals'); // Adjust redirection path if necessary
    });

    consoleErrorSpy.mockRestore();
  });

  it('handles fetch errors for submission details', async () => {
    // Mock failed fetch response for submission details
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    // Mock console.error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<SubmissionDetailPage params={{ id: submissionId }} />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(`/api/submissions/${submissionId}`); // Adjust endpoint
      expect(consoleErrorSpy).toHaveBeenCalled(); // Check error logging
      // Check for error message display or redirection
    });

    consoleErrorSpy.mockRestore();
  });

   it('handles fetch errors for attachments', async () => {
    // Mock successful fetch for submission details but failed for attachments
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSubmission),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

    // Mock console.error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<SubmissionDetailPage params={{ id: submissionId }} />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(`/api/files/submission/${submissionId}`); // Adjust endpoint
      expect(consoleErrorSpy).toHaveBeenCalled(); // Check error logging
      // Check for error message display or default empty attachments state
    });

    consoleErrorSpy.mockRestore();
  });


  it('handles Approve button click', async () => {
    // Mock successful fetch responses for initial render
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockSubmission) } as Response)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockAttachments) } as Response);

    // Mock successful fetch response for the approve action
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'Submission approved successfully' }),
    } as Response);

    render(<SubmissionDetailPage params={{ id: submissionId }} />);

    // Wait for initial data fetching to complete
    await waitFor(() => {
      expect(mockSubmissionDetails).toHaveBeenCalled(); // Ensure component is rendered with data
    });

    // Click the Approve button (find it within the mocked ActionButtons component)
    const { getByRole } = render(<SubmissionDetailPage params={{ id: submissionId }} />);
    const approveButton = getByRole('button', { name: /Approve/i });
    await userEvent.click(approveButton);

    // Assert that the correct API endpoint was called for approval
    expect(global.fetch).toHaveBeenCalledWith(
      `/api/submissions/${submissionId}/approve`, // Adjust endpoint if necessary
      expect.objectContaining({
        method: 'PATCH', // Assuming PATCH method for approval
      })
    );

    // Assert that a success toast is displayed
    expect(toast.success).toHaveBeenCalledWith('Submission approved successfully'); // Adjust message if necessary

    // Assert that the user is redirected (e.g., back to the approvals list)
    expect(mockPush).toHaveBeenCalledWith('/manager/approvals'); // Adjust redirection path if necessary
  });

  it('handles Reject button click', async () => {
    // Mock successful fetch responses for initial render
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockSubmission) } as Response)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockAttachments) } as Response);

    // Mock successful fetch response for the reject action
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'Submission rejected successfully' }),
    } as Response);

    render(<SubmissionDetailPage params={{ id: submissionId }} />);

    // Wait for initial data fetching to complete
    await waitFor(() => {
      expect(mockSubmissionDetails).toHaveBeenCalled(); // Ensure component is rendered with data
    });

    // Click the Reject button
    const { getByRole } = render(<SubmissionDetailPage params={{ id: submissionId }} />);
    const rejectButton = getByRole('button', { name: /Reject/i });
    await userEvent.click(rejectButton);

    // Assert that the correct API endpoint was called for rejection
    expect(global.fetch).toHaveBeenCalledWith(
      `/api/submissions/${submissionId}/reject`, // Adjust endpoint if necessary
      expect.objectContaining({
        method: 'PATCH', // Assuming PATCH method for rejection
      })
    );

    // Assert that a success toast is displayed
    expect(toast.success).toHaveBeenCalledWith('Submission rejected successfully'); // Adjust message if necessary

    // Assert that the user is redirected
    expect(mockPush).toHaveBeenCalledWith('/manager/approvals'); // Adjust redirection path if necessary
  });

  it('handles Add Comment button click', async () => {
    // Mock successful fetch responses for initial render
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockSubmission) } as Response)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockAttachments) } as Response);

    // Mock successful fetch response for adding a comment
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'Comment added successfully' }),
    } as Response);

    render(<SubmissionDetailPage params={{ id: submissionId }} />);

    // Wait for initial data fetching to complete
    await waitFor(() => {
      expect(mockSubmissionDetails).toHaveBeenCalled(); // Ensure component is rendered with data
    });

    // Click the Add Comment button
    const { getByRole } = render(<SubmissionDetailPage params={{ id: submissionId }} />);
    const addCommentButton = getByRole('button', { name: /Add Comment/i });
    await userEvent.click(addCommentButton);

    // Assert that the correct API endpoint was called for adding a comment
    expect(global.fetch).toHaveBeenCalledWith(
      `/api/submissions/${submissionId}/comment`, // Adjust endpoint if necessary
      expect.objectContaining({
        method: 'POST', // Assuming POST method for adding a comment
        body: JSON.stringify({ comment: 'Test Comment' }), // Check the body content
      })
    );

    // Assert that a success toast is displayed
    expect(toast.success).toHaveBeenCalledWith('Comment added successfully'); // Adjust message if necessary

    // Note: Adding a comment might not always result in a redirect.
    // If the component updates the UI to show the new comment, you would assert that here.
    // expect(mockPush).not.toHaveBeenCalled(); // Assert no redirection if applicable
  });


  // TODO: Test loading state
});