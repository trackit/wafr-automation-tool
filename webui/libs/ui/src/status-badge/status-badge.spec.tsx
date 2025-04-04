import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';

import StatusBadge from './status-badge';

describe('StatusBadge', () => {
  it('renders null when no status is provided', () => {
    const { container } = render(<StatusBadge status={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders "Scan Started" status with info color', () => {
    render(<StatusBadge status="SCANNING_STARTED" />);
    const badge = screen.getByText('Scan Started');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('badge-info');
  });

  it('renders "Preparing" status with info color', () => {
    render(<StatusBadge status="PREPARING_PROMPTS" />);
    const badge = screen.getByText('Preparing');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('badge-info');
  });

  it('renders "Invoking LLM" status with info color', () => {
    render(<StatusBadge status="INVOKING_LLM" />);
    const badge = screen.getByText('Invoking LLM');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('badge-info');
  });

  it('renders "Ready" status with success color', () => {
    render(<StatusBadge status="FINISHED" />);
    const badge = screen.getByText('Ready');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('badge-success');
  });

  it('renders "Errored" status with error color', () => {
    render(<StatusBadge status="ERRORED" />);
    const badge = screen.getByText('Errored');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('badge-error');
  });

  it('applies custom className when provided', () => {
    render(<StatusBadge status="FINISHED" className="custom-class" />);
    const badge = screen.getByText('Ready');
    expect(badge).toHaveClass('custom-class');
  });

  it('has required base classes', () => {
    render(<StatusBadge status="FINISHED" />);
    const badge = screen.getByText('Ready');
    expect(badge).toHaveClass('badge', 'font-bold', 'badge-soft');
  });
});
