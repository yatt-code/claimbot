// __tests__/frontend/admin/users/page.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UsersPage from '@/app/admin/users/page'; // Adjust the import path if necessary
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

describe('Admin Users Page', () => {
  const mockPush = jest.fn();
  const mockUsers = [
    { _id: 'user1', name: 'Alice Smith', email: 'alice@example.com', role: 'staff' },
    { _id: 'user2', name: 'Bob Johnson', email: 'bob@example.com', role: 'manager' },
  ];

  beforeEach(() => {
    // Reset mocks before each test
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    toast.success = jest.fn();
    toast.error = jest.fn();
    global.fetch = jest.fn() as jest.Mock; // Cast global.fetch to jest.Mock
  });

  it('renders the page and fetches user data', async () => {
    // Mock successful fetch response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockUsers),
    } as Response);

    render(<UsersPage />);

    // Wait for data fetching to complete
    await waitFor(() => {
      // Check if fetch was called with the correct endpoint
      expect(global.fetch).toHaveBeenCalledWith('/api/users'); // Adjust endpoint if necessary

      // Check if user data is displayed (adjust based on how users are rendered)
      expect(screen.getByText(/Alice Smith/i)).toBeInTheDocument();
      expect(screen.getByText(/alice@example.com/i)).toBeInTheDocument();
      expect(screen.getByText(/staff/i)).toBeInTheDocument();
      expect(screen.getByText(/Bob Johnson/i)).toBeInTheDocument();
      expect(screen.getByText(/bob@example.com/i)).toBeInTheDocument();
      expect(screen.getByText(/manager/i)).toBeInTheDocument();
    });
  });

  it('handles no users found', async () => {
    // Mock successful fetch response with an empty array
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    } as Response);

    render(<UsersPage />);

    // Wait for data fetching to complete
    await waitFor(() => {
      // Check if a "no users found" message is displayed (adjust based on component)
      // expect(screen.getByText(/No users found/i)).toBeInTheDocument(); // Adjust message if necessary
      // Or check that the table/list of users is empty
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

    render(<UsersPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/users'); // Adjust endpoint
      expect(consoleErrorSpy).toHaveBeenCalled(); // Check error logging
      // Check for error message display
      // expect(screen.getByText(/Error fetching users/i)).toBeInTheDocument(); // Adjust message if necessary
    });

    consoleErrorSpy.mockRestore();
  });

  it('navigates to user detail page on clicking a user entry', async () => {
    // Mock successful fetch response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockUsers),
    } as Response);

    const { getByText } = render(<UsersPage />);

    // Wait for data to be displayed
    await waitFor(() => {
      expect(getByText(/Alice Smith/i)).toBeInTheDocument();
    });

    // Click on a user entry (assuming the user's name or email is a clickable link)
    // Adjust the selector based on the actual implementation
    const userEntry = getByText(/Alice Smith/i); // Assuming the name is clickable
    await userEvent.click(userEntry);

    // Assert that router.push was called with the correct user detail URL
    expect(mockPush).toHaveBeenCalledWith(`/admin/users/${mockUsers[0]._id}`); // Adjust path if necessary
  });

  it('navigates to new user page on clicking "Add New User" button', async () => {
    // Mock successful fetch response (page still fetches data even with the button)
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockUsers),
    } as Response);

    const { getByRole } = render(<UsersPage />);

    // Wait for data to be displayed (optional, but ensures the button is likely present)
     await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/users');
    });


    // Click the "Add New User" button (adjust selector based on actual implementation)
    const addNewUserButton = getByRole('button', { name: /Add New User/i }); // Assuming a button with this text
    await userEvent.click(addNewUserButton);

    // Assert that router.push was called with the new user page URL
    expect(mockPush).toHaveBeenCalledWith('/admin/users/new'); // Adjust path if necessary
  });


  // TODO: Test loading state
});