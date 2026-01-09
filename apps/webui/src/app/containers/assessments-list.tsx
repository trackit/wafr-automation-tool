import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  Calendar,
  Computer,
  Earth,
  EllipsisVertical,
  LayoutDashboard,
  RefreshCw,
  Search,
  Server,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useDebounceValue } from 'usehooks-ts';

import {
  type ApiError,
  deleteAssessment,
  getAssessments,
  getAssessmentStep,
  getOrganization,
  rescanAssessment,
} from '@webui/api-client';
import { ConfirmationModal, StatusBadge } from '@webui/ui';

import { formatACEOpportunity } from '../../lib/assessment-utils';
import { getThemeColors } from '../../lib/theme-colors';
import CreateAWSMilestoneDialog from './create-aws-milestone-dialog';
import CreateOpportunityDialog from './create-opportunity-dialog';
import ExportToAWSDialog from './export-to-aws-dialog';
import ListAWSMilestonesDialog from './list-aws-milestones-dialog';
import NewAssessmentDialog from './new-assessment-dialog';
import PDFExportsDialog from './pdf-exports-dialog';

function AssessmentsList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useDebounceValue('', 500);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  const [idToRescan, setIdToRescan] = useState<string | null>(null);
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['assessments', search],
    queryFn: ({ pageParam }) =>
      getAssessments({ limit: 24, search, nextToken: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextToken,
    initialPageParam: '',
    retry: (failureCount, error: ApiError) => {
      if (error?.statusCode === 503 && failureCount < 3) {
        return true;
      }
      return failureCount < 1;
    },
    retryDelay: (attemptIndex, error: ApiError) => {
      if (error?.statusCode === 503) {
        return 12000;
      }
      return Math.min(1000 * 2 ** attemptIndex, 24000);
    },
  });

  const { data: organization } = useQuery({
    queryKey: ['organization'],
    queryFn: getOrganization,
    retry: (failureCount, error: ApiError) => {
      if (error?.statusCode === 503 && failureCount < 3) {
        return true;
      }
      return failureCount < 1;
    },
    retryDelay: (attemptIndex, error: ApiError) => {
      if (error?.statusCode === 503) {
        return 12000;
      }
      return Math.min(1000 * 2 ** attemptIndex, 24000);
    },
  });

  const opportunitiesThisYear = useMemo(() => {
    if (!organization?.opportunitiesPerMonth) return 0;
    if (!Array.isArray(organization.opportunitiesPerMonth)) return 0;

    const currentYear = new Date().getFullYear();

    return organization.opportunitiesPerMonth
      .filter((item: { month?: string; opportunities?: number }) => {
        if (!item.month) return false;
        const year = parseInt(item.month.split('-')[1], 10);
        return year === currentYear;
      })
      .reduce(
        (total: number, item: { opportunities?: number }) =>
          total + (item.opportunities || 0),
        0,
      );
  }, [organization?.opportunitiesPerMonth]);

  // Transform opportunitiesPerMonth data for the chart
  const opportunitiesChartData = useMemo(() => {
    if (!organization?.opportunitiesPerMonth) return [];

    let data: Array<{ month: string; opportunities: number }> = [];

    if (Array.isArray(organization.opportunitiesPerMonth)) {
      // If it's already an array, use it directly (sort if needed)
      data = organization.opportunitiesPerMonth
        .filter((item) => item.month) // Filter out invalid entries
        .sort((a, b) => {
          // Ensure sorting by month (assuming MM-YYYY format)
          const monthA = parseInt(a.month.split('-')[0]);
          const monthB = parseInt(b.month.split('-')[0]);
          return monthA - monthB;
        });
    }

    return data;
  }, [organization?.opportunitiesPerMonth]);

  // Pie chart data for assessments goal (10 assessments target)
  const assessmentsPieChartData = useMemo(() => {
    const goal = 10;
    const current = organization?.currentYearTotalAssessments ?? 0;
    const completed = Math.min(current, goal);
    const remaining = Math.max(0, goal - completed);
    const percentage = goal > 0 ? Math.round((completed / goal) * 100) : 0;

    return {
      data: [
        { name: 'Completed', value: completed },
        { name: 'Remaining', value: remaining },
      ],
      percentage,
      completed,
      goal,
    };
  }, [organization?.currentYearTotalAssessments]);

  const extractAccountId = (roleArn: string | undefined) => {
    if (!roleArn) return '';
    const match = roleArn.match(/arn:aws:iam::(\d+):/);
    return match ? match[1] : '';
  };

  const [assessmentSteps, setAssessmentSteps] = useState<
    Record<string, string>
  >({});
  const knownRef = useRef<Record<string, boolean>>({});
  const pendingRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    knownRef.current = Object.fromEntries(
      Object.keys(assessmentSteps).map((k) => [k, true]),
    );
  }, [assessmentSteps]);

  const fetchStep = useCallback(async (id: string) => {
    if (knownRef.current[id] || pendingRef.current[id]) return;
    pendingRef.current[id] = true;
    try {
      const step = await getAssessmentStep(id);
      if (step) setAssessmentSteps((prev) => ({ ...prev, [id]: step }));
    } finally {
      delete pendingRef.current[id];
    }
  }, []);

  useEffect(() => {
    if (!data?.pages) return;

    for (const page of data.pages) {
      for (const a of page.assessments ?? []) {
        const id = a?.id;
        if (!id) continue;

        if (knownRef.current[id] || pendingRef.current[id]) continue;

        if (a.error || a.finishedAt) {
          knownRef.current[id] = true;
          setAssessmentSteps((prev) => ({
            ...prev,
            [id]: a.error ? 'ERRORED' : 'FINISHED',
          }));
        }
        if (!assessmentSteps[id] && !pendingRef.current[id]) {
          void fetchStep(id);
        }
      }
    }
  }, [data, fetchStep, assessmentSteps]);

  const { mutate: deleteAssessmentMutation } = useMutation({
    mutationFn: (id: string) => deleteAssessment({ assessmentId: id }),
    onMutate: () => {
      setIdToDelete(null);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['assessments'] });
    },
    onError: () => {
      setIdToDelete(null);
    },
  });

  const rescanAssessmentMutation = useMutation({
    mutationFn: (id: string) => rescanAssessment({ assessmentId: id }),
    onMutate: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['assessment', idToRescan],
        }),
        queryClient.invalidateQueries({ queryKey: ['assessments'] }),
      ]);
      setIdToRescan(null);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['assessment', idToRescan],
      });
      await refetch();
    },
  });

  const handleDeleteAssessment = (id: string) => {
    deleteAssessmentMutation(id);
  };

  return (
    <div className="container py-8 px-4 overflow-auto flex-1 flex flex-col gap-4">
      <div className="prose mb-2 w-full flex flex-row gap-4 justify-between items-center max-w-none">
        <h2 className="mt-0 mb-0 font-medium text-2xl">Dashboard</h2>
        <div className="flex flex-row gap-4">
          <label className="input input-sm rounded-lg w-full max-w-xs">
            <Search className="w-4 h-4" />
            <input
              type="search"
              className="grow"
              placeholder="Search "
              defaultValue={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <NewAssessmentDialog />
        </div>
      </div>
      {opportunitiesChartData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card bg-white border rounded-lg p-4 md:col-span-2 lg:col-span-2">
            <h2 className="card-title mb-4">WAFR Opportunities per Month</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={opportunitiesChartData}
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  content={({ payload }) => {
                    if (payload && payload.length > 0) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-base-300 border rounded-lg p-3 shadow-lg">
                          <p className="font-medium">{data.month}</p>
                          <p className="text-sm">
                            Opportunities: {data.opportunities}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="opportunities"
                  fill={getThemeColors().primary}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card bg-white border rounded-lg p-4">
            <h2 className="card-title mb-4"> {currentYear} Assessments Goal</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={assessmentsPieChartData.data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {assessmentsPieChartData.data.map((entry, index) => {
                    const colors = getThemeColors();
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.name === 'Completed'
                            ? colors.success
                            : '#e5e7eb'
                        }
                      />
                    );
                  })}
                  <Label
                    value={`${assessmentsPieChartData.percentage}%`}
                    position="center"
                    style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      fill: getThemeColors().baseContent,
                    }}
                  />
                </Pie>
                <Tooltip
                  content={({ payload }) => {
                    if (payload && payload.length > 0) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-base-300 border rounded-lg p-3 shadow-lg">
                          <p className="font-medium">{data.name}</p>
                          <p className="text-sm">
                            {data.value} assessment
                            {data.value !== 1 ? 's' : ''}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="text-center mt-2 text-sm text-base-content/70">
              {assessmentsPieChartData.completed} of{' '}
              {assessmentsPieChartData.goal} assessments
            </div>
          </div>
          <div className="card bg-white border rounded-lg p-4 flex flex-col gap-4">
            <h2 className="card-title text-center">{currentYear} Summary</h2>
            <div className="flex sm:flex-row md:flex-col gap-4 h-full justify-center items-center">
              <div className="text-center flex-1 flex flex-col justify-center items-center">
                <div className="text-5xl font-bold text-primary font-light tracking-tighter">
                  {organization?.currentYearTotalAssessments ?? 0}
                </div>
                <div className="text-sm text-base-content/70 mt-1">
                  Total Assessments
                </div>
              </div>
              <div className="text-center flex-1 flex flex-col justify-center items-center">
                <div className="text-5xl font-bold text-success font-light tracking-tighter">
                  {opportunitiesThisYear}
                </div>
                <div className="text-sm text-base-content/70 mt-1">
                  Total Opportunities
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        className="grid gap-4 rounded-lg border border-neutral-content bg-base-100 shadow-md p-4 w-full"
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(300px, ${
            data?.pages?.[0]?.assessments?.length === 1 && isLargeScreen
              ? '50%'
              : '1fr'
          }))`,
        }}
      >
        {isLoading ? (
          <div className="flex flex-row gap-2 justify-center items-center w-full h-full col-span-full">
            <div
              className="loading loading-ring text-primary w-8 h-8"
              role="status"
            ></div>
          </div>
        ) : null}
        {data?.pages.length === 0 ||
        data?.pages?.[0]?.assessments?.length === 0 ? (
          <div className="text-center text-base-content/80 col-span-full">
            No assessments found
          </div>
        ) : null}
        {data?.pages.map((page) =>
          page.assessments?.map((assessment) => (
            <div
              className={`
                border border-neutral-content rounded-lg p-4
                hover:shadow-md hover:shadow-primary/20 hover:bg-primary/4
                transition-all duration-300
                cursor-pointer
                w-full h-full
              `}
              key={`${assessment.id}-${Math.random()}`}
              onClick={() => navigate(`/assessments/${assessment.id}`)}
            >
              <div className="flex flex-col gap-2 justify-between h-full w-full">
                <div className="flex flex-row justify-between items-start mb-2 gap-1">
                  <div className="lg:text-lg md:text-base text-sm font-semibold text-primary">
                    {assessment.name}
                  </div>
                  <div className="flex flex-row items-center gap-1 flex-1 flex-grow justify-end">
                    {assessmentSteps[assessment.id!] ? (
                      <StatusBadge
                        status={assessmentSteps[assessment.id!]}
                        className="badge-sm flex-shrink-0 "
                      />
                    ) : (
                      <span className="loading loading-dots loading-xs text-base-content"></span>
                    )}
                    <div
                      className="dropdown dropdown-end"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <div
                        tabIndex={0}
                        role="button"
                        className="btn btn-ghost btn-xs p-1"
                      >
                        <EllipsisVertical className="w-4 h-4" />
                      </div>
                      <ul
                        tabIndex={0}
                        className="dropdown-content menu bg-base-100 rounded-box z-50 w-60 p-2 shadow-sm"
                      >
                        <li>
                          <button
                            className="flex flex-row gap-2 text-primary w-full text-left"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setIdToRescan(assessment.id ?? null);
                            }}
                          >
                            <RefreshCw className="w-4 h-4" /> Rescan
                          </button>
                        </li>
                        <li className="m-1"></li>
                        <li>
                          <ExportToAWSDialog
                            assessmentId={assessment.id ?? ''}
                            askForRegion={!assessment.exportRegion}
                            onSuccess={refetch}
                          />
                        </li>
                        <li>
                          <CreateAWSMilestoneDialog
                            assessmentId={assessment.id ?? ''}
                            disabled={!assessment.exportRegion}
                          />
                        </li>
                        <li>
                          <ListAWSMilestonesDialog
                            assessmentId={assessment.id ?? ''}
                            disabled={!assessment.exportRegion}
                          />
                        </li>
                        <li>
                          <PDFExportsDialog assessmentId={assessment.id!} />
                        </li>
                        <li>
                          <CreateOpportunityDialog
                            assessmentId={assessment.id!}
                            hasOpportunityId={!!assessment.opportunityId}
                            hasWafrWorkloadArn={!!assessment.wafrWorkloadArn}
                          />
                        </li>
                        <li className="m-1"></li>
                        <li>
                          <button
                            className="flex flex-row gap-2 text-error w-full text-left"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setIdToDelete(assessment.id ?? null);
                            }}
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-sm text-base-content flex flex-row gap-2 items-center">
                    <Server className="w-4 h-4" />
                    Account: {extractAccountId(assessment.roleArn)}
                  </div>
                  <div className="text-sm text-base-content flex flex-row gap-2 items-center">
                    <Calendar className="w-4 h-4" />
                    Created:{' '}
                    {assessment.createdAt
                      ? new Date(assessment.createdAt).toLocaleDateString()
                      : 'N/A'}
                  </div>
                  <div className="text-sm text-base-content flex flex-row gap-2 items-center">
                    <Earth className="w-4 h-4" />
                    {assessment.regions?.join(', ') || 'Global'}
                  </div>
                  <div className="text-sm text-base-content flex flex-row gap-2 items-center">
                    <Computer className="w-4 h-4" />
                    Workflow:
                    {Array.isArray(assessment.workflows)
                      ? assessment.workflows.length
                        ? assessment.workflows.join(', ')
                        : ' -'
                      : assessment.workflows || ' -'}
                  </div>
                  <div className="text-sm text-base-content flex flex-row gap-2 items-center">
                    <LayoutDashboard className="w-5 h-5" />
                    ACE Opportunity:{' '}
                    {formatACEOpportunity(assessment.opportunityId)}
                  </div>
                </div>
              </div>
            </div>
          )),
        )}
      </div>
      {!isLoading && hasNextPage && (
        <div className="flex flex-row gap-4 justify-center">
          <button
            className="btn btn-accent btn-soft text-sm"
            onClick={() => fetchNextPage()}
            disabled={!hasNextPage || isFetchingNextPage}
          >
            {isFetchingNextPage
              ? 'Loading more...'
              : hasNextPage
                ? 'Load More'
                : 'Nothing more to load'}
          </button>
        </div>
      )}
      {idToDelete && (
        <ConfirmationModal
          title="Delete Assessment"
          message="Are you sure you want to delete this assessment?"
          onConfirm={() => handleDeleteAssessment(idToDelete)}
          open={true}
          onClose={() => setIdToDelete(null)}
          onCancel={() => setIdToDelete(null)}
        />
      )}
      {idToRescan && (
        <ConfirmationModal
          title="Rescan Assessment"
          message="Are you sure you want to rescan this assessment? This might take a while."
          onConfirm={() => rescanAssessmentMutation.mutate(idToRescan)}
          open={true}
          onClose={() => setIdToRescan(null)}
          onCancel={() => setIdToRescan(null)}
        />
      )}
    </div>
  );
}

export default AssessmentsList;
