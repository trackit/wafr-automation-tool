import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  type InfiniteData,
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { Calendar, Search, Server } from 'lucide-react';
import { enqueueSnackbar } from 'notistack';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell as PieCell,
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
  deleteAssessment,
  getAssessments,
  getAssessmentStep,
  getOrganization,
  rescanAssessment,
  updateAssessment,
} from '@webui/api-client';
import { ConfirmationModal } from '@webui/ui';

import { getThemeColors } from '../../lib/theme-colors';
import CreateAWSMilestoneDialog from './create-aws-milestone-dialog';
import CreateOpportunityDialog from './create-opportunity-dialog';
import DraggableAssessmentCard from './draggable-assessment-card';
import ExportToAWSDialog from './export-to-aws-dialog';
import ListAWSMilestonesDialog from './list-aws-milestones-dialog';
import NewAssessmentDialog from './new-assessment-dialog';
import NewFolderDialog from './new-folder-dialog';
import PDFExportsDialog from './pdf-exports-dialog';
import SidebarFolderItem from './sidebar-folder-item';

function AssessmentsList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useDebounceValue('', 500);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [draggedAssessment, setDraggedAssessment] = useState<unknown>(null);
  const currentYear = new Date().getFullYear();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const [idToRescan, setIdToRescan] = useState<string | null>(null);
  const folderFilter = selectedFolder ?? '';

  const {
    data,
    isLoading,
    isPlaceholderData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['assessments', search, folderFilter],
    queryFn: ({ pageParam }) =>
      getAssessments({
        limit: 24,
        search,
        nextToken: pageParam,
        folder: folderFilter,
      }),
    getNextPageParam: (lastPage) => lastPage.nextToken,
    initialPageParam: '',
    placeholderData: keepPreviousData,
  });

  const isLoadingAssessments = isLoading || isPlaceholderData;

  const { data: organization } = useQuery({
    queryKey: ['organization'],
    queryFn: getOrganization,
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
      data = organization.opportunitiesPerMonth
        .filter((item) => item.month)
        .sort((a, b) => {
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

  type AssessmentsPage = Awaited<ReturnType<typeof getAssessments>>;
  type AssessmentsData = InfiniteData<AssessmentsPage>;
  type OrganizationData = Awaited<ReturnType<typeof getOrganization>>;

  const updateFolderMutation = useMutation({
    mutationFn: ({
      assessmentId,
      folder,
    }: {
      assessmentId: string;
      folder?: string | null;
    }) =>
      updateAssessment({
        assessmentId,
        folder: folder as string | undefined,
      }),
    onMutate: async ({ assessmentId, folder }) => {
      await queryClient.cancelQueries({
        queryKey: ['assessments', search, folderFilter],
      });
      await queryClient.cancelQueries({ queryKey: ['organization'] });

      const previousAssessmentsData = queryClient.getQueryData<AssessmentsData>(
        ['assessments', search, folderFilter],
      );

      const previousOrganizationData =
        queryClient.getQueryData<OrganizationData>(['organization']);

      const oldFolder = previousAssessmentsData?.pages
        ?.flatMap((p) => p.assessments ?? [])
        ?.find((a) => a.id === assessmentId)?.folder;

      const oldFolderKey = oldFolder ?? '';
      const newFolderKey = folder ?? '';

      if (previousAssessmentsData?.pages) {
        const newAssessmentsData: AssessmentsData = {
          ...previousAssessmentsData,
          pages: previousAssessmentsData.pages.map((page) => ({
            ...page,
            assessments: page.assessments?.filter(
              (assessment) => assessment.id !== assessmentId,
            ),
          })),
        };
        queryClient.setQueryData(
          ['assessments', search, folderFilter],
          newAssessmentsData,
        );
      }

      if (previousOrganizationData?.folderCounts) {
        const newFolderCounts = { ...previousOrganizationData.folderCounts };
        if (
          newFolderCounts[oldFolderKey] !== undefined &&
          newFolderCounts[oldFolderKey] > 0
        ) {
          newFolderCounts[oldFolderKey] = newFolderCounts[oldFolderKey] - 1;
        }
        newFolderCounts[newFolderKey] =
          (newFolderCounts[newFolderKey] ?? 0) + 1;

        queryClient.setQueryData<OrganizationData>(['organization'], {
          ...previousOrganizationData,
          folderCounts: newFolderCounts,
        });
      }

      return { previousAssessmentsData, previousOrganizationData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousAssessmentsData) {
        queryClient.setQueryData(
          ['assessments', search, folderFilter],
          context.previousAssessmentsData,
        );
      }
      if (context?.previousOrganizationData) {
        queryClient.setQueryData(
          ['organization'],
          context.previousOrganizationData,
        );
      }
      enqueueSnackbar({
        message: 'Failed to move assessment to folder',
        variant: 'error',
      });
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['assessments'] });
      await queryClient.invalidateQueries({ queryKey: ['organization'] });
    },
  });

  const handleDeleteAssessment = (id: string) => {
    deleteAssessmentMutation(id);
  };

  // Get all assessments from pages
  const allAssessments = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.assessments ?? []);
  }, [data?.pages]);

  const folders = (organization?.folders ?? []).toSorted((a, b) =>
    a.localeCompare(b),
  );

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    setDraggedAssessment(null);
    const { active, over } = event;

    if (!over) return;

    const activeData = active.data.current as
      | { type: string; assessment: { id: string } }
      | undefined;
    const overData = over.data.current as
      | { type: string; folderName?: string }
      | undefined;

    if (activeData?.type === 'assessment' && activeData.assessment?.id) {
      if (overData?.type === 'folder') {
        updateFolderMutation.mutate({
          assessmentId: activeData.assessment.id,
          folder: overData.folderName,
        });
      } else if (overData?.type === 'uncategorized') {
        updateFolderMutation.mutate({
          assessmentId: activeData.assessment.id,
          folder: null,
        });
      }
    }
  };

  const handleDragStart = (event: {
    active: { data: { current: unknown } };
  }) => {
    const activeData = event.active.data.current as
      | { assessment: unknown }
      | undefined;
    if (activeData?.assessment) {
      setDraggedAssessment(activeData.assessment);
    }
  };

  const extractAccountId = (roleArn: string | undefined) => {
    if (!roleArn) return '';
    const match = roleArn.match(/arn:aws:iam::(\d+):/);
    return match ? match[1] : '';
  };

  return (
    <DndContext
      sensors={sensors}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
    >
      <div className="container py-8 px-4 overflow-auto flex-1 flex flex-col gap-4">
        <div className="prose mb-2 w-full flex flex-row gap-4 justify-between items-center max-w-none">
          <h2 className="mt-0 mb-0 font-medium text-2xl">Dashboard</h2>
          <div className="flex flex-row gap-4">
            <label className="input input-sm rounded-lg w-full max-w-xs">
              <Search className="w-4 h-4" />
              <input
                type="search"
                className="grow"
                placeholder="Search"
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
              <h2 className="card-title mb-4">
                {' '}
                {currentYear} Assessments Goal
              </h2>
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
                        <PieCell
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

        <div className="flex flex-row gap-4 flex-1 items-stretch">
          {data && (
            <aside className="w-36 md:w-40 lg:w-44 h-full flex-shrink-0 rounded-lg border border-neutral-content bg-base-100 shadow-md flex flex-col">
              <div className="p-2 border-b border-neutral-content flex items-center justify-between">
                <h3 className="font-semibold text-sm text-base-content">
                  Folders
                </h3>
                <NewFolderDialog compact />
              </div>
              <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1 min-h-0">
                <SidebarFolderItem
                  name="Main"
                  assessmentCount={organization?.folderCounts?.[''] ?? 0}
                  isActive={selectedFolder === null}
                  onClick={() => setSelectedFolder(null)}
                  isMain
                />
                {folders.map((folder) => (
                  <SidebarFolderItem
                    key={folder}
                    name={folder}
                    assessmentCount={organization?.folderCounts?.[folder] ?? 0}
                    isActive={selectedFolder === folder}
                    onClick={() => setSelectedFolder(folder)}
                    onFolderDeleted={() => {
                      if (selectedFolder === folder) {
                        setSelectedFolder(null);
                      }
                    }}
                  />
                ))}
              </div>
            </aside>
          )}

          <div className="flex-1 flex flex-col gap-4 min-w-0">
            <div
              className="grid gap-4 rounded-lg border border-neutral-content bg-base-100 shadow-md p-4 w-full flex-1"
              style={{
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                alignContent: 'start',
              }}
            >
              {isLoadingAssessments ? (
                <div className="flex flex-row gap-2 justify-center items-center w-full h-full col-span-full">
                  <div
                    className="loading loading-ring text-primary w-8 h-8"
                    role="status"
                  ></div>
                </div>
              ) : null}

              {allAssessments.length === 0 && !isLoadingAssessments ? (
                <div className="text-center text-base-content/80 col-span-full py-8">
                  {selectedFolder !== null
                    ? 'No assessments in this folder'
                    : 'No assessments found'}
                </div>
              ) : null}

              {!isLoadingAssessments &&
                allAssessments.map((assessment) => (
                  <DraggableAssessmentCard
                    key={assessment.id}
                    assessment={assessment}
                    status={assessmentSteps[assessment.id!]}
                    onClick={() => navigate(`/assessments/${assessment.id}`)}
                    onRescan={() => setIdToRescan(assessment.id ?? null)}
                    onDelete={() => setIdToDelete(assessment.id ?? null)}
                    folders={folders}
                    onMoveToFolder={(folder) =>
                      updateFolderMutation.mutate({
                        assessmentId: assessment.id!,
                        folder,
                      })
                    }
                    renderDialogs={() => (
                      <>
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
                      </>
                    )}
                  />
                ))}
            </div>
            {!isLoadingAssessments && hasNextPage && (
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
          </div>
        </div>
      </div>

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

      <DragOverlay>
        {draggedAssessment ? (
          <div className="border border-primary rounded-lg p-4 bg-base-100 shadow-xl opacity-90 w-[300px]">
            <div className="flex flex-col gap-2">
              <div className="font-semibold text-primary">
                {(draggedAssessment as { name?: string }).name}
              </div>
              <div className="text-sm text-base-content flex flex-row gap-2 items-center">
                <Server className="w-4 h-4" />
                Account:{' '}
                {extractAccountId(
                  (draggedAssessment as { roleArn?: string }).roleArn,
                )}
              </div>
              <div className="text-sm text-base-content flex flex-row gap-2 items-center">
                <Calendar className="w-4 h-4" />
                Created:{' '}
                {(draggedAssessment as { createdAt?: string }).createdAt
                  ? new Date(
                      (draggedAssessment as { createdAt?: string }).createdAt!,
                    ).toLocaleDateString()
                  : 'N/A'}
              </div>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default AssessmentsList;
