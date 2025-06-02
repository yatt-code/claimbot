// __tests__/frontend/Button.test.tsx
import React from 'react';
import { render } from '@testing-library/react';
import { Button } from '@/components/ui/button'; // Assuming the Button component is here

describe('Button', () => {
  it('renders the button with correct text', () => {
    const { getByText } = render(<Button>Click Me</Button>);

    // Use getByText from render result to find the button by its text content
    const buttonElement = getByText(/Click Me/i);

    expect(buttonElement).toBeInTheDocument();
  });

  // TODO: Add more tests for different button variants, sizes, disabled state, etc.
});