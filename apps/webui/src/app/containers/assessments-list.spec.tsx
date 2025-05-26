import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useNavigate } from 'react-router';
import AssessmentsList from './assessments-list';
import { getAssessments, deleteAssessment } from '@webui/api-client';

// Mock the API calls
vi.mock('@webui/api-client', () => ({
  getAssessments: vi.fn(),
  deleteAssessment: vi.fn(),
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
        role_arn: 'arn:aws:iam::123456789012:role/test-role',
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        name: 'Test Assessment 2',
        step: 'SCANNING_STARTED',
        role_arn: 'arn:aws:iam::098765432109:role/test-role',
        created_at: '2024-01-02T00:00:00Z',
      },
    ],
    next_token: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getAssessments as any).mockResolvedValue(mockAssessments);
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
      next_token: null,
    });

    render(<AssessmentsList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('No assessments found')).toBeInTheDocument();
    });
  });

  it('handles search input', async () => {
    render(<AssessmentsList />, { wrapper: createWrapper() });

    const searchInput = screen.getByPlaceholderText('Search an assessment');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    await waitFor(() => {
      expect(getAssessments).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'test' })
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
      screen.getByText('Are you sure you want to delete this assessment?')
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
      expect(deleteAssessment).toHaveBeenCalledWith({ assessmentId: 1 });
    });
  });

  it('shows load more button when there are more pages', async () => {
    (getAssessments as any).mockResolvedValue({
      ...mockAssessments,
      next_token: 'next-page-token',
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
          role_arn: 'arn:aws:iam::111111111111:role/test-role',
          created_at: '2024-01-03T00:00:00Z',
        },
      ],
      next_token: null,
    };

    (getAssessments as any)
      .mockResolvedValueOnce({
        ...mockAssessments,
        next_token: 'next-page-token',
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
