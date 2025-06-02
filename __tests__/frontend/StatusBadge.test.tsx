// __tests__/frontend/StatusBadge.test.tsx
import React from 'react';
import { render } from '@testing-library/react';
import StatusBadge from '@/components/StatusBadge'; // Adjust the import path if necessary

describe('StatusBadge', () => {
  it('renders the badge with correct text for "Pending" status', () => {
    const { getByText } = render(<StatusBadge status="Pending" />);
    const badgeElement = getByText(/Pending/i);
    expect(badgeElement).toBeInTheDocument();
    // TODO: Add assertion for specific styling/class names if needed
  });

  it('renders the badge with correct text for "Approved" status', () => {
    const { getByText } = render(<StatusBadge status="Approved" />);
    const badgeElement = getByText(/Approved/i);
    expect(badgeElement).toBeInTheDocument();
    // TODO: Add assertion for specific styling/class names if needed
  });

  it('renders the badge with correct text for "Rejected" status', () => {
    const { getByText } = render(<StatusBadge status="Rejected" />);
    const badgeElement = getByText(/Rejected/i);
    expect(badgeElement).toBeInTheDocument();
    // TODO: Add assertion for specific styling/class names if needed
  });

  // TODO: Add tests for other potential statuses if applicable
});