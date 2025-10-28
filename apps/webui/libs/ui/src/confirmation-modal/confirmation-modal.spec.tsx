import '@testing-library/jest-dom';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ConfirmationModal from './confirmation-modal';

describe('ConfirmationModal', () => {
  const defaultProps = {
    title: 'Test Title',
    message: 'Test Message',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    onClose: vi.fn(),
  };

  it('renders modal content when open', async () => {
    render(<ConfirmationModal {...defaultProps} open={true} />);

    await waitFor(() => {
      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Message')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /cancel/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /confirm/i }),
      ).toBeInTheDocument();
    });
  });

  it('does not render when closed', async () => {
    render(<ConfirmationModal {...defaultProps} open={false} />);

    await waitFor(() => {
      expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
      expect(screen.queryByText('Test Message')).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /cancel/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /confirm/i }),
      ).not.toBeInTheDocument();
    });
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    render(<ConfirmationModal {...defaultProps} open={true} />);

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onCancel when cancel button is clicked', async () => {
    render(<ConfirmationModal {...defaultProps} open={true} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onClose when ESC key is pressed', async () => {
    render(<ConfirmationModal {...defaultProps} open={true} />);

    fireEvent.keyDown(document.body, { key: 'Escape', code: 'Escape' });

    await waitFor(() => {
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('renders with custom title and message', async () => {
    const customProps = {
      ...defaultProps,
      title: 'Custom Title',
      message: 'Custom Message',
      open: true,
    };

    render(<ConfirmationModal {...customProps} />);

    await waitFor(() => {
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.getByText('Custom Message')).toBeInTheDocument();
    });
  });
});
