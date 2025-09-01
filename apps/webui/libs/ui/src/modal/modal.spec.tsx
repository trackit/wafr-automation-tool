import '@testing-library/jest-dom';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import Modal from './modal';

describe('Modal', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
  };

  it('renders modal content when open', async () => {
    render(
      <Modal {...defaultProps}>
        <div>Test Content</div>
      </Modal>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Content')).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('does not render when closed', async () => {
    render(
      <Modal {...defaultProps} open={false}>
        <div>Test Content</div>
      </Modal>
    );

    await waitFor(() => {
      expect(screen.queryByText('Test Content')).not.toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('calls onClose when ESC key is pressed', async () => {
    render(
      <Modal {...defaultProps}>
        <div>Test Content</div>
      </Modal>
    );

    fireEvent.keyDown(document.body, { key: 'Escape', code: 'Escape' });

    await waitFor(() => {
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('applies custom className to DialogPanel', async () => {
    render(
      <Modal {...defaultProps} className="custom-class">
        <div>Test Content</div>
      </Modal>
    );

    await waitFor(() => {
      const panel = screen
        .getByRole('dialog')
        .querySelector('[id^="headlessui-dialog-panel"]');
      expect(panel).toHaveClass('custom-class');
    });
  });

  it('renders with notCentered prop', async () => {
    render(
      <Modal {...defaultProps} notCentered>
        <div>Test Content</div>
      </Modal>
    );

    await waitFor(() => {
      const container = screen
        .getByRole('dialog')
        .querySelector('.fixed.inset-0.flex.w-screen');
      expect(container).toHaveClass('items-start');
    });
  });

  it('renders with centered content by default', async () => {
    render(
      <Modal {...defaultProps}>
        <div>Test Content</div>
      </Modal>
    );

    await waitFor(() => {
      const container = screen
        .getByRole('dialog')
        .querySelector('.fixed.inset-0.flex.w-screen');
      expect(container).toHaveClass('items-center');
    });
  });
});
