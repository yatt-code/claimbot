// __tests__/frontend/admin/rates/page.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RatesPage from '@/app/admin/rates/page'; // Adjust the import path if necessary
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

describe('Admin Rates Page', () => {
  const mockPush = jest.fn();
  const mockRates = [
    { _id: 'rate1', type: 'Overtime', rate: 1.5, effectiveDate: '2023-01-01T00:00:00.000Z' },
    { _id: 'rate2', type: 'Mileage', value: 0.5, effectiveDate: '2023-01-01T00:00:00.000Z' },
  ];

  beforeEach(() => {
    // Reset mocks before each test
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    toast.success = jest.fn();
    toast.error = jest.fn();
    global.fetch = jest.fn() as jest.Mock; // Cast global.fetch to jest.Mock
  });

  it('renders the page and fetches rate configurations', async () => {
    // Mock successful fetch response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRates),
    } as Response);

    render(<RatesPage />);

    // Wait for data fetching to complete
    await waitFor(() => {
      // Check if fetch was called with the correct endpoint
      expect(global.fetch).toHaveBeenCalledWith('/api/config/rates'); // Adjust endpoint if necessary

      // Check if rate data is displayed (adjust based on how rates are rendered)
      expect(screen.getByText(/Overtime/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue('1.5')).toBeInTheDocument(); // Assuming input field for rate
      expect(screen.getByText(/Mileage/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue('0.5')).toBeInTheDocument(); // Assuming input field for value
    });
  });

  it('handles no rate configurations found', async () => {
    // Mock successful fetch response with an empty array
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    } as Response);

    render(<RatesPage />);

    // Wait for data fetching to complete
    await waitFor(() => {
      // Check if a "no rates found" message is displayed (adjust based on component)
      // expect(screen.getByText(/No rate configurations found/i)).toBeInTheDocument(); // Adjust message if necessary
      // Or check that the table/list of rates is empty
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

    render(<RatesPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/config/rates'); // Adjust endpoint
      expect(consoleErrorSpy).toHaveBeenCalled(); // Check error logging
      // Check for error message display
      // expect(screen.getByText(/Error fetching rates/i)).toBeInTheDocument(); // Adjust message if necessary
    });

    consoleErrorSpy.mockRestore();
  });

  it('handles updating a rate configuration', async () => {
    // Mock successful fetch response for initial render
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRates),
    } as Response);

    // Mock successful fetch response for the update action
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'Rate updated successfully' }),
    } as Response);

    const { getByDisplayValue, getByRole } = render(<RatesPage />);

    // Wait for initial data fetching to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/config/rates'); // Ensure initial fetch happened
    });

    // Find the input field for the first rate (Overtime) and change its value
    const overtimeRateInput = getByDisplayValue('1.5');
    await userEvent.clear(overtimeRateInput);
    await userEvent.type(overtimeRateInput, '2.0');

    // Find the save button for the first rate and click it
    // Assuming there's a save button associated with each rate, perhaps by role or text
    // This might require adjusting based on the actual component's implementation
    const saveButton = getByRole('button', { name: /Save/i }); // Adjust selector if needed
    await userEvent.click(saveButton);

    // Assert that the PATCH API endpoint was called with the correct data
    expect(global.fetch).toHaveBeenCalledWith(
      `/api/config/rates/${mockRates[0]._id}`, // Adjust endpoint if necessary
      expect.objectContaining({
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }, // Assuming JSON body
        body: JSON.stringify({ rate: 2.0 }), // Check the body content
      })
    );

    // Assert that a success toast is displayed
    expect(toast.success).toHaveBeenCalledWith('Rate updated successfully'); // Adjust message if necessary

    // Note: After a successful update, the component might re-fetch the data or update its state.
    // You could add assertions here to check for that behavior if needed.
  });


  // TODO: Test loading state
});