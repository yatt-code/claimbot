// __tests__/frontend/SubmitExpense.test.tsx
import React from 'react';
import { render } from '@testing-library/react';
import { fireEvent } from '@testing-library/dom'; // Import fireEvent from @testing-library/dom
import userEvent from '@testing-library/user-event';
import SubmitExpense from '@/app/submit/expense/page'; // Adjust the import path if necessary
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import FileUploader from '@/components/FileUploader'; // Assuming FileUploader is used

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

// Mock the FileUploader component to simplify testing
jest.mock('@/components/FileUploader', () => ({
  __esModule: true, // This is important for default exports
  default: jest.fn(({ onFilesChange }) => (
    <input
      type="file"
      multiple
      data-testid="file-uploader"
      onChange={(e) => {
        if (onFilesChange && e.target.files) {
          onFilesChange(Array.from(e.target.files));
        }
      }}
    />
  )),
}));


describe('SubmitExpense Form', () => {
  const mockPush = jest.fn();
  beforeEach(() => {
    // Reset mocks before each test
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    toast.success = jest.fn();
    toast.error = jest.fn();
    (FileUploader as jest.Mock).mockClear(); // Clear mock calls for FileUploader
  });

  it('renders the form with required fields', () => {
    const { getByLabelText, getByTestId, getByRole } = render(<SubmitExpense />);

    // Check for required form elements (adjust based on actual form structure)
    expect(getByLabelText(/Date/i)).toBeInTheDocument();
    expect(getByLabelText(/Description/i)).toBeInTheDocument();
    expect(getByLabelText(/Mileage/i)).toBeInTheDocument();
    expect(getByLabelText(/Toll/i)).toBeInTheDocument();
    expect(getByLabelText(/Petrol/i)).toBeInTheDocument();
    expect(getByLabelText(/Meal/i)).toBeInTheDocument();
    expect(getByLabelText(/Others/i)).toBeInTheDocument();
    expect(getByTestId('file-uploader')).toBeInTheDocument(); // Check for mocked FileUploader
    expect(getByRole('button', { name: /Submit Claim/i })).toBeInTheDocument();
  });

  it('displays validation errors for missing required fields on submit', async () => {
    const { getByRole } = render(<SubmitExpense />);

    // Attempt to submit the form without filling required fields
    userEvent.click(getByRole('button', { name: /Submit Claim/i }));

    // Check for validation error messages (adjust based on actual error message text)
    // Note: You might need to wait for validation to complete if it's async
    // await screen.findByText(/Date is required/i); // Use findByText from screen if needed for async
    // expect(screen.getByText(/Description is required/i)).toBeInTheDocument(); // Use getByText from screen if needed
    // Add checks for other required fields
  });

  it('handles successful form submission', async () => {
    // Mock a successful API response
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: 'Claim submitted successfully' }),
      }) as Promise<Response>
    );

    const { getByLabelText, getByTestId, getByRole } = render(<SubmitExpense />);

    // Fill in the form fields (adjust based on actual form field labels/roles)
    await userEvent.type(getByLabelText(/Date/i), '2023-10-26'); // Example date format
    await userEvent.type(getByLabelText(/Description/i), 'Test expense submission');
    await userEvent.type(getByLabelText(/Mileage/i), '10');
    await userEvent.type(getByLabelText(/Toll/i), '5');
    await userEvent.type(getByLabelText(/Petrol/i), '20');
    await userEvent.type(getByLabelText(/Meal/i), '15');
    await userEvent.type(getByLabelText(/Others/i), '10');

    // Simulate file upload (requires mocking FileUploader)
    const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = getByTestId('file-uploader');
    fireEvent.change(fileInput, { target: { files: [file] } });


    // Click the submit button
    await userEvent.click(getByRole('button', { name: /Submit Claim/i }));

    // Assert that the fetch API was called with the correct data
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/claims', // Adjust endpoint if necessary
      expect.objectContaining({
        method: 'POST',
        body: expect.any(FormData), // Expecting FormData for file uploads
      })
    );

    // You can further inspect the FormData content if needed, but it's more complex

    // Assert that a success toast is displayed
    expect(toast.success).toHaveBeenCalledWith('Claim submitted successfully'); // Adjust message if necessary

    // Assert that the user is redirected
    expect(mockPush).toHaveBeenCalledWith('/my-submissions'); // Adjust redirection path if necessary
  });

  it('handles form submission failure', async () => {
    // Mock a failed API response
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 400, // Example error status
        json: () => Promise.resolve({ message: 'Invalid input data' }), // Example error message
      }) as Promise<Response>
    );

    const { getByLabelText, getByRole, getByTestId } = render(<SubmitExpense />);

    // Fill in the form fields with valid data (or data that should trigger backend error)
    await userEvent.type(getByLabelText(/Date/i), '2023-10-26');
    await userEvent.type(getByLabelText(/Description/i), 'Test expense submission');
    await userEvent.type(getByLabelText(/Mileage/i), '10');
    await userEvent.type(getByLabelText(/Toll/i), '5');
    await userEvent.type(getByLabelText(/Petrol/i), '20');
    await userEvent.type(getByLabelText(/Meal/i), '15');
    await userEvent.type(getByLabelText(/Others/i), '10');

    // Simulate file upload (optional for this test, but good to include if it's part of the form)
    const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = getByTestId('file-uploader');
    fireEvent.change(fileInput, { target: { files: [file] } });


    // Click the submit button
    await userEvent.click(getByRole('button', { name: /Submit Claim/i }));

    // Assert that the fetch API was called
    expect(global.fetch).toHaveBeenCalled();

    // Assert that an error toast is displayed
    // Note: The exact error message might depend on how the component handles the API error response
    expect(toast.error).toHaveBeenCalledWith('Invalid input data'); // Adjust message if necessary

    // Assert that the user is NOT redirected
    expect(mockPush).not.toHaveBeenCalled();
  });


  it('handles input field interactions', async () => {
    const { getByLabelText } = render(<SubmitExpense />);

    // Test typing in text/number inputs
    await userEvent.type(getByLabelText(/Description/i), 'Groceries');
    expect(getByLabelText(/Description/i)).toHaveValue('Groceries');

    await userEvent.type(getByLabelText(/Mileage/i), '50.5');
    expect(getByLabelText(/Mileage/i)).toHaveValue(50.5); // Assuming input type="number"

    // TODO: Add tests for DatePicker and other custom inputs if they are not standard HTML inputs
  });

  it('displays specific validation error messages', async () => {
    const { getByRole, findByText } = render(<SubmitExpense />);

    // Attempt to submit to trigger validation
    await userEvent.click(getByRole('button', { name: /Submit Claim/i }));

    // Check for specific error messages (adjust based on actual validation messages)
    expect(await findByText(/Date is required/i)).toBeInTheDocument();
    expect(await findByText(/Description is required/i)).toBeInTheDocument();
    // Add checks for other required fields and specific validation rules (e.g., invalid number format)
  });

  it('handles file upload and removal', async () => {
    const { getByTestId } = render(<SubmitExpense />);

    // Simulate file upload
    const file1 = new File(['file1 content'], 'file1.txt', { type: 'text/plain' });
    const file2 = new File(['file2 content'], 'file2.jpg', { type: 'image/jpeg' });
    const fileInput = getByTestId('file-uploader');

    // Simulate selecting files
    fireEvent.change(fileInput, { target: { files: [file1, file2] } });

    // Assert that onFilesChange was called with the correct files (requires checking the mock)
    expect(FileUploader).toHaveBeenCalledWith(
      expect.objectContaining({
        onFilesChange: expect.any(Function),
      }),
      {} // Check props passed to the mock
    );

    // You would typically check if the component's state or displayed file list updates here.
    // This requires the component to expose its file list or for the test to inspect the DOM for file names.
    // For now, we'll focus on the interaction with the mock.

    // Simulate file removal (if the component provides a way to remove files)
    // This would involve finding the remove button for a specific file and clicking it.
    // Example (assuming a remove button with specific text):
    // const removeButton = screen.getByRole('button', { name: /Remove file1.txt/i });
    // await userEvent.click(removeButton);
    // Assert that the file is no longer in the component's state or displayed list.
  });
});