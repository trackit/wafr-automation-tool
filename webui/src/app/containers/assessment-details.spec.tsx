import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router';
import { getAssessment, updateStatus } from '@webui/api-client';

import AssessmentDetails from './assessment-details';

// Mock API calls
vi.mock('@webui/api-client', () => ({
  getAssessment: vi.fn(),
  updateStatus: vi.fn(),
}));

// Mock data
const mockAssessment = {
  id: '1',
  name: 'Test Assessment',
  step: 'FINISHED',
  findings: [
    {
      id: 'pillar-1',
      label: 'Security',
      questions: [
        {
          id: 'question-1',
          label: 'Test Question 1',
          best_practices: [
            {
              id: 'practice-1',
              label: 'Test Practice 1',
              risk: 'High',
              status: false,
              results: [],
            },
            {
              id: 'practice-2',
              label: 'Test Practice 2',
              risk: 'Medium',
              status: true,
              results: [],
            },
          ],
        },
        {
          id: 'question-2',
          label: 'Test Question 2',
          best_practices: [
            {
              id: 'practice-3',
              label: 'Test Practice 3',
              risk: 'High',
              status: true,
              results: [],
            },
          ],
        },
      ],
    },
  ],
};

// Wrapper component to provide necessary context
const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/assessments/1']}>
        <Routes>
          <Route path="/assessments/:id" element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('AssessmentDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getAssessment as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAssessment
    );
  });

  it('renders loading state initially', () => {
    render(<AssessmentDetails />, { wrapper });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders assessment details after loading', async () => {
    render(<AssessmentDetails />, { wrapper });

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /Assessment Test Assessment/i })
      ).toBeInTheDocument();
      // Look for the question text in the vertical menu
      const menuItems = screen.getAllByRole('menuitem', {
        name: /Test Question 1/i,
      });
      expect(menuItems[0]).toBeInTheDocument();
      expect(screen.getByText('Test Practice 1')).toBeInTheDocument();
    });
  });

  it('shows loading state when assessment is scanning', async () => {
    (getAssessment as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockAssessment,
      step: 'SCANNING_STARTED',
    });

    render(<AssessmentDetails />, { wrapper });

    // First check for the loading ring
    expect(screen.getByRole('status')).toBeInTheDocument();

    // Then check for the scanning text in the timeline
    await waitFor(() => {
      expect(screen.getByText('Scanning your account')).toBeInTheDocument();
    });
  });

  it('shows error state when assessment has errored', async () => {
    (getAssessment as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockAssessment,
      step: 'ERRORED',
    });

    render(<AssessmentDetails />, { wrapper });

    await waitFor(() => {
      expect(
        screen.getByText(
          'An error occurred while running the assessment. Please try again.'
        )
      ).toBeInTheDocument();
    });
  });

  it('updates best practice status when checkbox is clicked', async () => {
    (updateStatus as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
    });

    render(<AssessmentDetails />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Test Practice 1')).toBeInTheDocument();
    });

    // Find the checkbox in the first row of the table
    const checkbox = screen.getAllByRole('checkbox')[0];
    await fireEvent.click(checkbox);

    await waitFor(() => {
      expect(updateStatus).toHaveBeenCalledWith(
        '1',
        'pillar-1',
        'question-1',
        'practice-1',
        true
      );
    });
  });

  //   it('navigates to next question when next button is clicked', async () => {
  //     render(<AssessmentDetails />, { wrapper });

  //     await waitFor(() => {
  //       expect(
  //         screen.getByText((content, element) => {
  //           return element?.textContent?.includes('Test Question 1') ?? false;
  //         })
  //       ).toBeInTheDocument();
  //     });

  //     const nextButton = screen.getByRole('button', { name: /next/i });
  //     await fireEvent.click(nextButton);

  //     await waitFor(() => {
  //       expect(
  //         screen.getByText((content, element) => {
  //           return element?.textContent?.includes('Test Question 2') ?? false;
  //         })
  //       ).toBeInTheDocument();
  //     });
  //   });

  it('shows findings details modal when clicking on failed findings count', async () => {
    const assessmentWithResults = {
      ...mockAssessment,
      findings: [
        {
          ...mockAssessment.findings[0],
          questions: [
            {
              ...mockAssessment.findings[0].questions[0],
              best_practices: [
                {
                  ...mockAssessment.findings[0].questions[0].best_practices[0],
                  results: [{ id: 'result-1', details: 'Test result' }],
                },
              ],
            },
          ],
        },
      ],
    };

    (getAssessment as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      assessmentWithResults
    );

    render(<AssessmentDetails />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    const findingsButton = screen.getByText('1');
    await fireEvent.click(findingsButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  //   it('updates pillar when tab is clicked', async () => {
  //     const assessmentWithMultiplePillars = {
  //       ...mockAssessment,
  //       findings: [
  //         mockAssessment.findings[0],
  //         {
  //           id: 'pillar-2',
  //           label: 'Cost Optimization',
  //           questions: [
  //             {
  //               id: 'question-3',
  //               label: 'Test Question 3',
  //               best_practices: [],
  //             },
  //           ],
  //         },
  //       ],
  //     };

  //     (getAssessment as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
  //       assessmentWithMultiplePillars
  //     );

  //     render(<AssessmentDetails />, { wrapper });

  //     await waitFor(() => {
  //       expect(
  //         screen.getByRole('tab', { name: /Cost Optimization 0\/1/i })
  //       ).toBeInTheDocument();
  //     });

  //     const costTab = screen.getByRole('tab', {
  //       name: /Cost Optimization 0\/1/i,
  //     });
  //     await fireEvent.click(costTab);

  //     await waitFor(() => {
  //       // Look for the question text in the vertical menu
  //       const menuItems = screen.getAllByRole('button', {
  //         name: /Test Question 3/i,
  //       });
  //       expect(menuItems[0]).toBeInTheDocument();
  //     });
  //   });
});
