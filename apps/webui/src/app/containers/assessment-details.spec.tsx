import '@testing-library/jest-dom';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { getAssessment, updateStatus } from '@webui/api-client';

import AssessmentDetails from './assessment-details';

// Mock ResizeObserver for Recharts components
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

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
  pillars: [
    {
      id: 'pillar-1',
      label: 'Security',
      questions: [
        {
          id: 'question-1',
          label: 'Test Question 1',
          bestPractices: [
            {
              id: 'practice-1',
              label: 'Test Practice 1',
              risk: 'High',
              checked: false,
              results: [],
            },
            {
              id: 'practice-2',
              label: 'Test Practice 2',
              risk: 'Medium',
              checked: true,
              results: [],
            },
          ],
        },
        {
          id: 'question-2',
          label: 'Test Question 2',
          bestPractices: [
            {
              id: 'practice-3',
              label: 'Test Practice 3',
              risk: 'High',
              checked: true,
              results: [],
            },
          ],
        },
      ],
    },
  ],
  graphData: {
    resourceTypes: {
      AwsLambdaFunction: 124,
      AwsCloudFrontDistribution: 106,
      AwsKinesisStream: 2,
      AwsLogsLogGroup: 3,
      AwsEcsCluster: 1,
      AwsEcsTaskDefinition: 2,
      AwsCloudFormationStack: 9,
      AwsIamUser: 77,
      AwsApiGatewayStage: 5,
      AwsCloudTrailTrail: 7,
      AwsApiGatewayRestApi: 22,
      AwsCognitoUserPool: 7,
      AwsEc2SecurityGroup: 3,
      AwsIamPolicy: 92,
      AwsSecretsManagerSecret: 5,
      AWSCloudFrontDistribution: 16,
      AwsIamAccessKey: 19,
      AwsRoute53HostedZone: 3,
      AwsS3AccountPublicAccessBlock: 1,
      AwsEc2Vpc: 1,
      AwsCloudWatchAlarm: 2,
      AwsDynamoDbTable: 11,
      AwsS3Bucket: 135,
      AwsAccount: 1,
      AwsBackupBackupVault: 1,
      AwsWafv2WebAcl: 4,
      AwsEc2NetworkAcl: 6,
      AwsEcrRepository: 14,
      AwsGuardDutyDetector: 1,
      AwsIamRole: 346,
      Other: 75,
    },
    regions: {
      'us-east-1': 621,
      'us-west-1': 684,
      'us-west-2': 4,
    },
    findings: 1309,
    severities: {
      High: 441,
      Critical: 26,
      Low: 232,
      Medium: 402,
    },
  },
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
      mockAssessment,
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
        screen.getByRole('heading', { name: /Assessment Test Assessment/i }),
      ).toBeInTheDocument();
    });

    // Click on the Security pillar tab to access questions
    const securityTab = screen.getByRole('tab', { name: /Security.*/i });
    fireEvent.click(securityTab);

    await waitFor(() => {
      // Look for the question text in the vertical menu
      const menuItems = screen.getAllByRole('menuitem', {
        name: /Test Question 1/i,
      });
      expect(menuItems[0]).toBeInTheDocument();
      expect(screen.getByText('Test Practice 1')).toBeInTheDocument();
    });
  });

  it('shows overview tab by default and allows switching to pillar tabs', async () => {
    render(<AssessmentDetails />, { wrapper });

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /Assessment Test Assessment/i }),
      ).toBeInTheDocument();
    });

    // Verify that the overview tab exists and is visible
    const overviewTab = screen.getByRole('tab', { name: /Overview/i });
    expect(overviewTab).toBeInTheDocument();

    // Verify that the Security pillar tab exists
    const securityTab = screen.getByRole('tab', { name: /Security.*/i });
    expect(securityTab).toBeInTheDocument();

    // Click on the Security pillar tab
    fireEvent.click(securityTab);

    // Verify that we can now see questions
    await waitFor(() => {
      expect(screen.getAllByText('Test Question 1')).toHaveLength(2); // One in menu, one in header
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
        screen.getByText('An error occurred while running the assessment.'),
      ).toBeInTheDocument();
    });
  });

  it('updates best practice status when checkbox is clicked', async () => {
    (updateStatus as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
    });

    render(<AssessmentDetails />, { wrapper });

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /Assessment Test Assessment/i }),
      ).toBeInTheDocument();
    });

    // Click on the Security pillar tab to access questions
    const securityTab = screen.getByRole('tab', { name: /Security.*/i });
    fireEvent.click(securityTab);

    await waitFor(() => {
      expect(screen.getByText('Test Practice 1')).toBeInTheDocument();
    });

    // Find the checkbox in the first row of the table
    const checkbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(updateStatus).toHaveBeenCalledWith(
        '1',
        'pillar-1',
        'question-1',
        'practice-1',
        true,
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
      pillars: [
        {
          ...mockAssessment.pillars[0],
          questions: [
            {
              ...mockAssessment.pillars[0].questions[0],
              bestPractices: [
                {
                  ...mockAssessment.pillars[0].questions[0].bestPractices[0],
                  results: [{ id: 'result-1', details: 'Test result' }],
                },
              ],
            },
          ],
        },
      ],
    };

    (getAssessment as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      assessmentWithResults,
    );

    render(<AssessmentDetails />, { wrapper });

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /Assessment Test Assessment/i }),
      ).toBeInTheDocument();
    });

    // Click on the Security pillar tab to access questions
    const securityTab = screen.getByRole('tab', { name: /Security.*/i });
    fireEvent.click(securityTab);

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    const findingsButton = screen.getByText('1');
    fireEvent.click(findingsButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  //   it('updates pillar when tab is clicked', async () => {
  //     const assessmentWithMultiplePillars = {
  //       ...mockAssessment,
  //       pillars: [
  //         mockAssessment.pillars[0],
  //         {
  //           id: 'pillar-2',
  //           label: 'Cost Optimization',
  //           questions: [
  //             {
  //               id: 'question-3',
  //               label: 'Test Question 3',
  //               bestPractices: [],
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
