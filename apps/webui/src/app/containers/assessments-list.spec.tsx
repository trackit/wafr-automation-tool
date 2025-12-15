/* eslint-disable @typescript-eslint/no-explicit-any */
import '@testing-library/jest-dom';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import {
  deleteAssessment,
  getAssessments,
  getAssessmentStep,
} from '@webui/api-client';

import AssessmentsList from './assessments-list';

// Mock the API calls
vi.mock('@webui/api-client', () => ({
  getAssessments: vi.fn(),
  deleteAssessment: vi.fn(),
  getAssessmentStep: vi.fn(),
  getOrganization: vi.fn(),
}));

// Mock the router
const mockNavigate = vi.fn();

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Create a wrapper component with necessary providers
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('AssessmentsList', () => {
  const mockAssessments = {
    assessments: [
      {
        id: '1',
        name: 'Test Assessment 1',
        step: 'FINISHED',
        roleArn: 'arn:aws:iam::123456789012:role/test-role',
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        name: 'Test Assessment 2',
        step: 'SCANNING_STARTED',
        roleArn: 'arn:aws:iam::098765432109:role/test-role',
        createdAt: '2024-01-02T00:00:00Z',
      },
    ],
    nextToken: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getAssessments as any).mockResolvedValue(mockAssessments);
    (getAssessmentStep as any).mockResolvedValue('FINISHED');
  });

  it('renders loading state initially', () => {
    render(<AssessmentsList />, { wrapper: createWrapper() });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders assessments list after loading', async () => {
    render(<AssessmentsList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Test Assessment 1')).toBeInTheDocument();
      expect(screen.getByText('Test Assessment 2')).toBeInTheDocument();
      expect(screen.getByText('Account: 123456789012')).toBeInTheDocument();
      expect(screen.getByText('Account: 098765432109')).toBeInTheDocument();
    });
  });

  it('shows "No assessments found" when there are no assessments', async () => {
    (getAssessments as any).mockResolvedValue({
      assessments: [],
      nextToken: null,
    });

    render(<AssessmentsList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('No assessments found')).toBeInTheDocument();
    });
  });

  it('handles search input', async () => {
    render(<AssessmentsList />, { wrapper: createWrapper() });

    const searchInput = screen.getByPlaceholderText('Search');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    await waitFor(() => {
      expect(getAssessments).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'test' }),
      );
    });
  });

  it('navigates to assessment detail when clicked', async () => {
    render(<AssessmentsList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Test Assessment 1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Test Assessment 1'));

    expect(mockNavigate).toHaveBeenCalledWith('/assessments/1');
  });

  it('shows delete confirmation modal when delete is clicked', async () => {
    render(<AssessmentsList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Test Assessment 1')).toBeInTheDocument();
    });

    // Open dropdown for first assessment
    const dropdownButtons = screen.getAllByRole('button', { name: '' });
    const firstDropdownButton = dropdownButtons[0];
    await act(async () => {
      fireEvent.click(firstDropdownButton);
    });

    // Click delete
    const deleteButtons = screen.getAllByText('Delete');
    const firstDeleteButton = deleteButtons[0];
    await act(async () => {
      fireEvent.click(firstDeleteButton);
    });

    // Check if confirmation modal appears
    expect(screen.getByText('Delete Assessment')).toBeInTheDocument();
    expect(
      screen.getByText('Are you sure you want to delete this assessment?'),
    ).toBeInTheDocument();
  });

  it('handles assessment deletion', async () => {
    (deleteAssessment as any).mockResolvedValue({});

    render(<AssessmentsList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Test Assessment 1')).toBeInTheDocument();
    });

    // Open dropdown and click delete for first assessment
    const dropdownButtons = screen.getAllByRole('button', { name: '' });
    const firstDropdownButton = dropdownButtons[0];
    await act(async () => {
      fireEvent.click(firstDropdownButton);
    });

    const deleteButtons = screen.getAllByText('Delete');
    const firstDeleteButton = deleteButtons[0];
    await act(async () => {
      fireEvent.click(firstDeleteButton);
    });

    // Confirm deletion
    await act(async () => {
      fireEvent.click(screen.getByText('Confirm'));
    });

    await waitFor(() => {
      expect(deleteAssessment).toHaveBeenCalledWith({ assessmentId: '1' });
    });
  });

  it('shows load more button when there are more pages', async () => {
    (getAssessments as any).mockResolvedValue({
      ...mockAssessments,
      nextToken: 'next-page-token',
    });

    render(<AssessmentsList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Load More')).toBeInTheDocument();
    });
  });

  it('loads more assessments when load more is clicked', async () => {
    const nextPageAssessments = {
      assessments: [
        {
          id: '3',
          name: 'Test Assessment 3',
          step: 'FINISHED',
          roleArn: 'arn:aws:iam::111111111111:role/test-role',
          createdAt: '2024-01-03T00:00:00Z',
        },
      ],
      nextToken: null,
    };

    (getAssessments as any)
      .mockResolvedValueOnce({
        ...mockAssessments,
        nextToken: 'next-page-token',
      })
      .mockResolvedValueOnce(nextPageAssessments);

    render(<AssessmentsList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Load More')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Load More'));

    await waitFor(() => {
      expect(screen.getByText('Test Assessment 3')).toBeInTheDocument();
    });
  });
});
