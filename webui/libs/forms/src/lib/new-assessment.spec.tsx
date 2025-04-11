import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import NewAssessment from './new-assessment';

describe('NewAssessment', () => {
  it('renders the form with all fields', () => {
    render(<NewAssessment onSubmit={vi.fn()} />);

    expect(screen.getByText('Assessment Name')).toBeInTheDocument();
    expect(screen.getByText('Role ARN')).toBeInTheDocument();
    expect(screen.getByText('Submit')).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    const onSubmitMock = vi.fn();
    render(<NewAssessment onSubmit={onSubmitMock} />);

    const nameInput = screen.getByRole('textbox', { name: /assessment name/i });
    const submitButton = screen.getByRole('button', { name: /submit/i });

    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Test Assessment' } });
    });

    await act(async () => {
      fireEvent.click(submitButton);
    });

    // Wait for the form submission to complete
    await vi.waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalledWith(
        {
          name: 'Test Assessment',
          roleArn: '',
          regions: [],
          workflox: '',
        },
        expect.any(Object)
      );
    });
  });

  it('shows error for empty name', async () => {
    render(<NewAssessment onSubmit={vi.fn()} />);

    const submitButton = screen.getByRole('button', { name: /submit/i });

    await act(async () => {
      fireEvent.click(submitButton);
    });

    expect(screen.getByText('Name is required')).toBeInTheDocument();
  });

  it('shows error for invalid role ARN format', async () => {
    render(<NewAssessment onSubmit={vi.fn()} />);

    const roleInput = screen.getByRole('textbox', { name: /role arn/i });
    const submitButton = screen.getByRole('button', { name: /submit/i });

    await act(async () => {
      fireEvent.change(roleInput, { target: { value: 'invalid-arn' } });
    });

    await act(async () => {
      fireEvent.click(submitButton);
    });

    expect(screen.getByText('Invalid AWS role ARN format')).toBeInTheDocument();
  });

  it('submits form with valid role ARN', async () => {
    const onSubmitMock = vi.fn();
    render(<NewAssessment onSubmit={onSubmitMock} />);

    const nameInput = screen.getByRole('textbox', { name: /assessment name/i });
    const roleInput = screen.getByRole('textbox', { name: /role arn/i });
    const submitButton = screen.getByRole('button', { name: /submit/i });

    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Test Assessment' } });
    });

    await act(async () => {
      fireEvent.change(roleInput, {
        target: { value: 'arn:aws:iam::123456789012:role/test-role' },
      });
    });

    await act(async () => {
      fireEvent.click(submitButton);
    });

    // Wait for the form submission to complete
    await vi.waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalledWith(
        {
          name: 'Test Assessment',
          roleArn: 'arn:aws:iam::123456789012:role/test-role',
        },
        expect.any(Object)
      );
    });
  });
});
