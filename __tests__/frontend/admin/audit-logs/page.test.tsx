// __tests__/frontend/admin/audit-logs/page.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import AuditLogsPage from '@/app/admin/audit-logs/page'; // Adjust the import path if necessary
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

// Mock the Table component or relevant parts if needed, but let's assume standard HTML elements for now

describe('Admin Audit Logs Page', () => {
  const mockPush = jest.fn();
  const mockAuditLogs = [
    { _id: 'log1', userId: 'user1', action: 'USER_LOGIN', timestamp: '2023-10-26T10:00:00.000Z', details: {} },
    { _id: 'log2', userId: 'user2', action: 'SUBMIT_CLAIM', timestamp: '2023-10-26T11:00:00.000Z', details: { claimId: 'claim123' } },
  ];

  beforeEach(() => {
    // Reset mocks before each test
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    toast.success = jest.fn();
    toast.error = jest.fn();
    global.fetch = jest.fn() as jest.Mock; // Cast global.fetch to jest.Mock
  });

  it('renders the page and fetches audit logs', async () => {
    // Mock successful fetch response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockAuditLogs),
    } as Response);

    render(<AuditLogsPage />);

    // Wait for data fetching to complete
    await waitFor(() => {
      // Check if fetch was called with the correct endpoint
      expect(global.fetch).toHaveBeenCalledWith('/api/audit-logs'); // Adjust endpoint if necessary

      // Check if audit log data is displayed (adjust based on how logs are rendered)
      expect(screen.getByText(/USER_LOGIN/i)).toBeInTheDocument();
      expect(screen.getByText(/SUBMIT_CLAIM/i)).toBeInTheDocument();
      // Note: Display of userId, timestamp, and details might require more specific selectors
    });
  });

  it('handles no audit logs found', async () => {
    // Mock successful fetch response with an empty array
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    } as Response);

    render(<AuditLogsPage />);

    // Wait for data fetching to complete
    await waitFor(() => {
      // Check if a "no logs found" message is displayed (adjust based on component)
      // expect(screen.getByText(/No audit logs found/i)).toBeInTheDocument(); // Adjust message if necessary
      // Or check that the table/list of logs is empty
    });
  });

  it('handles fetch errors', async () => {
    // Mock failed fetch response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    // Mock console.error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<AuditLogsPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/audit-logs'); // Adjust endpoint
      expect(consoleErrorSpy).toHaveBeenCalled(); // Check error logging
      // Check for error message display
      // expect(screen.getByText(/Error fetching audit logs/i)).toBeInTheDocument(); // Adjust message if necessary
    });

    consoleErrorSpy.mockRestore();
  });

  // TODO: Add tests for filtering and pagination if implemented
  // TODO: Test loading state
});