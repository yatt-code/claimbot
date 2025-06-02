// __tests__/frontend/admin/users/[id]/page.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserDetailPage from '@/app/admin/users/[id]/page'; // Adjust the import path if necessary
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

describe('Admin User Detail Page', () => {
  const mockPush = jest.fn();
  const userId = 'test-user-id';
  const mockUser = {
    _id: userId,
    name: 'Test User',
    email: 'test@example.com',
    role: 'staff',
    isActive: true,
    // Add other relevant user fields
  };

  beforeEach(() => {
    // Reset mocks before each test
    (useRouter as jest.Mock).mockReturnValue({ query: { id: userId }, push: mockPush });
    toast.success = jest.fn();
    toast.error = jest.fn();
    global.fetch = jest.fn() as jest.Mock; // Cast global.fetch to jest.Mock
  });

  it('renders the page and fetches user details', async () => {
    // Mock successful fetch response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockUser),
    } as Response);

    render(<UserDetailPage params={{ id: userId }} />);

    // Wait for data fetching to complete
    await waitFor(() => {
      // Check if fetch was called with the correct endpoint
      expect(global.fetch).toHaveBeenCalledWith(`/api/users/${userId}`); // Adjust endpoint if necessary

      // Check if user data is displayed in form fields (adjust based on form structure)
      expect(screen.getByLabelText(/Name/i)).toHaveValue('Test User');
      expect(screen.getByLabelText(/Email/i)).toHaveValue('test@example.com');
      // Assuming role is a select or similar input
      // expect(screen.getByLabelText(/Role/i)).toHaveValue('staff');
      // Assuming isActive is a checkbox or toggle
      // expect(screen.getByLabelText(/Active/i)).toBeChecked();
    });
  });

  it('handles user not found', async () => {
    // Mock fetch response indicating not found
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response);

    // Mock console.error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<UserDetailPage params={{ id: userId }} />);

    // Wait for fetch to complete
    await waitFor(() => {
      // Check if fetch was called
      expect(global.fetch).toHaveBeenCalledWith(`/api/users/${userId}`); // Adjust endpoint
      // Check if an error was logged
      expect(consoleErrorSpy).toHaveBeenCalled();

      // Check if a "not found" message is displayed or user is redirected
      // expect(screen.getByText(/User not found/i)).toBeInTheDocument(); // Adjust message
      // expect(mockPush).toHaveBeenCalledWith('/admin/users'); // Adjust redirection
    });

    consoleErrorSpy.mockRestore();
  });

  it('handles fetch errors', async () => {
    // Mock failed fetch response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    // Mock console.error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<UserDetailPage params={{ id: userId }} />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(`/api/users/${userId}`); // Adjust endpoint
      expect(consoleErrorSpy).toHaveBeenCalled(); // Check error logging
      // Check for error message display
      // expect(screen.getByText(/Error fetching user/i)).toBeInTheDocument(); // Adjust message
    });

    consoleErrorSpy.mockRestore();
  });

  it('handles updating user details', async () => {
    // Mock successful fetch response for initial render
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockUser),
    } as Response);

    // Mock successful fetch response for the update action
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'User updated successfully' }),
    } as Response);

    const { getByLabelText, getByRole } = render(<UserDetailPage params={{ id: userId }} />);

    // Wait for initial data fetching to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(`/api/users/${userId}`); // Ensure initial fetch happened
    });

    // Find an input field and change its value (adjust based on form structure)
    const nameInput = getByLabelText(/Name/i);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Updated User Name');

    // Find the save button and click it (adjust selector if needed)
    const saveButton = getByRole('button', { name: /Save/i }); // Assuming a save button
    await userEvent.click(saveButton);

    // Assert that the PATCH API endpoint was called with the correct data
    expect(global.fetch).toHaveBeenCalledWith(
      `/api/users/${userId}`, // Adjust endpoint if necessary
      expect.objectContaining({
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }, // Assuming JSON body
        body: JSON.stringify({ name: 'Updated User Name' }), // Check the body content
      })
    );

    // Assert that a success toast is displayed
    expect(toast.success).toHaveBeenCalledWith('User updated successfully'); // Adjust message if necessary

    // Assert that the user is redirected (e.g., back to the user list)
    expect(mockPush).toHaveBeenCalledWith('/admin/users'); // Adjust redirection path if necessary
  });


  it('handles deleting a user', async () => {
    // Mock successful fetch response for initial render
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockUser),
    } as Response);

    // Mock successful fetch response for the delete action
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'User deleted successfully' }),
    } as Response);

    const { getByRole } = render(<UserDetailPage params={{ id: userId }} />);

    // Wait for initial data fetching to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(`/api/users/${userId}`); // Ensure initial fetch happened
    });

    // Find the delete button and click it (adjust selector if needed)
    const deleteButton = getByRole('button', { name: /Delete/i }); // Assuming a delete button
    await userEvent.click(deleteButton);

    // Assert that the DELETE API endpoint was called
    expect(global.fetch).toHaveBeenCalledWith(
      `/api/users/${userId}`, // Adjust endpoint if necessary
      expect.objectContaining({
        method: 'DELETE',
      })
    );

    // Assert that a success toast is displayed
    expect(toast.success).toHaveBeenCalledWith('User deleted successfully'); // Adjust message if necessary

    // Assert that the user is redirected (e.g., back to the user list)
    expect(mockPush).toHaveBeenCalledWith('/admin/users'); // Adjust redirection path if necessary
  });


  // TODO: Test loading state
});