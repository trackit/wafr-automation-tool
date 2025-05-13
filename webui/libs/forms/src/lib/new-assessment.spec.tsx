import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import NewAssessment from './new-assessment';

describe('NewAssessment', () => {
  it('renders the form with all fields', () => {
    render(<NewAssessment onSubmit={vi.fn()} />);

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Role ARN')).toBeInTheDocument();
    expect(screen.getByText('Regions')).toBeInTheDocument();
    expect(screen.getByText('Workflows')).toBeInTheDocument();
    expect(screen.getByText('Submit')).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    const onSubmitMock = vi.fn();
    render(<NewAssessment onSubmit={onSubmitMock} />);

    const nameInput = screen.getByPlaceholderText('Enter assessment name');
    const submitButton = screen.getByRole('button', { name: /submit/i });

    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Test Assessment' } });
    });

    await act(async () => {
      fireEvent.click(submitButton);
    });

    await vi.waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalledWith({
        name: 'Test Assessment',
        roleArn: undefined,
        regions: [],
        workflows: [],
      });
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

    const roleInput = screen.getByPlaceholderText('Enter AWS role ARN');
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

    const nameInput = screen.getByPlaceholderText('Enter assessment name');
    const roleInput = screen.getByPlaceholderText('Enter AWS role ARN');
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

    await vi.waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalledWith({
        name: 'Test Assessment',
        roleArn: 'arn:aws:iam::123456789012:role/test-role',
        regions: [],
        workflows: [],
      });
    });
  });

  it('submits form with multiple workflows', async () => {
    const onSubmitMock = vi.fn();
    render(<NewAssessment onSubmit={onSubmitMock} />);

    const nameInput = screen.getByPlaceholderText('Enter assessment name');
    const workflowInput = screen.getByPlaceholderText('Enter a workflow name');
    const submitButton = screen.getByRole('button', { name: /submit/i });

    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Test Assessment' } });
    });

    await act(async () => {
      fireEvent.change(workflowInput, {
        target: { value: 'workflow1,workflow2,workflow3' },
      });
    });

    await act(async () => {
      fireEvent.click(submitButton);
    });

    await vi.waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalledWith({
        name: 'Test Assessment',
        roleArn: undefined,
        regions: [],
        workflows: ['workflow1', 'workflow2', 'workflow3'],
      });
    });
  });

  it('handles disabled state', () => {
    render(<NewAssessment onSubmit={vi.fn()} disabled />);
    const submitButton = screen.getByRole('button', { name: /submit/i });
    expect(submitButton).toBeDisabled();
  });
});
