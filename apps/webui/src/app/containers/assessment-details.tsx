import { components } from '@shared/api-schema';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import {
  deleteAssessment,
  getAssessment,
  getMilestone,
  rescanAssessment,
  updatePillar,
  updateQuestion,
  updateStatus,
} from '@webui/api-client';
import {
  ConfirmationModal,
  DataTable,
  Modal,
  StatusBadge,
  Tabs,
  Timeline,
  VerticalMenu,
} from '@webui/ui';
import {
  ChevronRight,
  CircleCheck,
  CircleMinus,
  EllipsisVertical,
  InfoIcon,
  RefreshCw,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import ErrorPage from './error-page';
import ExportToAWSDialog from './export-to-aws-dialog';
import FindingsDetails from './findings-details';
import CreateAWSMilestoneDialog from './create-aws-milestone-dialog';
import ListAWSMilestonesDialog from './list-aws-milestones-dialog';

type BestPractice = components['schemas']['BestPractice'];
type Question = components['schemas']['Question'];
type Pillar = components['schemas']['Pillar'];
type TableRow = BestPractice & { name: string };

export function AssessmentDetails() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showRescanModal, setShowRescanModal] = useState<boolean>(false);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [selectedPillarIndex, setSelectedPillarIndex] = useState<number>(0);
  const [selectedPillar, setSelectedPillar] = useState<Pillar | null>(null);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [bestPractice, setBestPractice] = useState<BestPractice | null>(null);
  const [bestPracticeDescription, setBestPracticeDescription] =
    useState<BestPractice | null>(null);
  const { id, milestoneId } = useParams();
  const [progress, setProgress] = useState<number>(0);
  
  const isMilestone = Boolean(milestoneId);

  const assessmentQuery = useQuery({
    queryKey: ['assessment', id],
    queryFn: () => (id ? getAssessment(id) : null),
    refetchInterval: isMilestone ? false : 15000, // Don't auto-refetch for milestones
  });

  const milestoneQuery = useQuery({
    queryKey: ['milestone', id, milestoneId],
    queryFn: () => {
      if (!id || !milestoneId) return null;
      return getMilestone({ assessmentId: id, milestoneId });
    },
    enabled: isMilestone, // Only fetch milestone data when in milestone mode
  });

  const assessmentData = assessmentQuery.data;
  const milestoneData = milestoneQuery.data;
  const isLoading = isMilestone ? milestoneQuery.isLoading || assessmentQuery.isLoading : assessmentQuery.isLoading;
  const refetch = assessmentQuery.refetch;
  const pillars = isMilestone ? milestoneData?.pillars : assessmentData?.pillars;

  const updateStatusMutation = useMutation({
    mutationFn: ({
      assessmentId,
      pillarId,
      questionId,
      bestPracticeId,
      checked,
    }: {
      assessmentId: string;
      pillarId: string;
      questionId: string;
      bestPracticeId: string;
      checked: boolean;
    }) =>
      updateStatus(assessmentId, pillarId, questionId, bestPracticeId, checked),
    onMutate: async ({ pillarId, questionId, bestPracticeId, checked }) => {
      if (isMilestone) return { previousData: null };
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['assessment', id],
      });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(['assessment', id]) as
        | components['schemas']['AssessmentContent']
        | undefined;

      if (!previousData?.pillars) {
        console.log('No previous data found');
        return { previousData };
      }

      // Create a deep copy of the data
      const newData = JSON.parse(
        JSON.stringify(previousData)
      ) as components['schemas']['AssessmentContent'];

      // Find and update the specific best practice using all IDs
      let updated = false;
      for (const pillar of newData.pillars || []) {
        if (pillar.id === pillarId) {
          for (const question of pillar.questions || []) {
            if (question.id === questionId) {
              for (const practice of question.bestPractices || []) {
                if (practice.id === bestPracticeId) {
                  practice.checked = checked;
                  updated = true;
                  break;
                }
              }
            }
            if (updated) break;
          }
        }
        if (updated) break;
      }

      // Update the cache with our optimistic value
      queryClient.setQueryData(['assessment', id], newData);

      // Update local state optimistically if we're viewing the updated pillar/question
      if (
        selectedPillar?.id === pillarId &&
        activeQuestion?.id === questionId
      ) {
        const updatedBestPractices = activeQuestion.bestPractices?.map(
          (practice) =>
            practice.id === bestPracticeId
              ? { ...practice, status: checked }
              : practice
        );
        setActiveQuestion({
          ...activeQuestion,
          bestPractices: updatedBestPractices,
        });
      }

      // Return a context object with the snapshotted value
      return { previousData };
    },
    onError: (_err, _variables, context) => {
      console.log('Error occurred, rolling back to:', context?.previousData);
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousData) {
        queryClient.setQueryData(['assessment', id], context.previousData);

        // Find the current pillar and question in the previous data
        if (context.previousData.pillars) {
          const pillar = context.previousData.pillars.find(
            (p) => p.id === selectedPillar?.id
          );
          if (pillar) {
            const question = pillar.questions?.find(
              (q) => q.id === activeQuestion?.id
            );
            if (question) {
              setActiveQuestion(question);
            }
          }
        }
      }
    },
    onSettled: () => {
      if (!isMilestone) {
        console.log('Mutation settled, refetching data');
        // Always refetch after error or success to ensure data is in sync with server
        queryClient.invalidateQueries({ queryKey: ['assessment', id] });
      }
    },
  });

  const updatePillarMutation = useMutation({
    mutationFn: ({
      assessmentId,
      pillarId,
      disabled,
    }: {
      assessmentId: string;
      pillarId: string;
      disabled: boolean;
    }) => updatePillar({ assessmentId, pillarId, disabled }),
    onMutate: async ({ pillarId, disabled }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['assessment', id],
      });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(['assessment', id]) as
        | components['schemas']['AssessmentContent']
        | undefined;

      if (!previousData?.pillars) {
        console.log('No previous data found');
        return { previousData };
      }

      // Create a deep copy of the data
      const newData = JSON.parse(
        JSON.stringify(previousData)
      ) as components['schemas']['AssessmentContent'];

      // Find and update the specific pillar
      for (const pillar of newData.pillars || []) {
        if (pillar.id === pillarId) {
          pillar.disabled = disabled;
          break;
        }
      }

      // Update the cache with our optimistic value
      queryClient.setQueryData(['assessment', id], newData);

      // Update local state optimistically if we're viewing the updated pillar
      if (selectedPillar?.id === pillarId) {
        setSelectedPillar({
          ...selectedPillar,
          disabled,
        });
      }

      // Return a context object with the snapshotted value
      return { previousData };
    },
    onError: (_err, _variables, context) => {
      console.log('Error occurred, rolling back to:', context?.previousData);
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousData) {
        queryClient.setQueryData(['assessment', id], context.previousData);

        // Find the current pillar in the previous data
        if (context.previousData.pillars) {
          const pillar = context.previousData.pillars.find(
            (p) => p.id === selectedPillar?.id
          );
          if (pillar) {
            setSelectedPillar(pillar);
          }
        }
      }
    },
    onSettled: () => {
      console.log('Mutation settled, refetching data');
      // Always refetch after error or success to ensure data is in sync with server
      queryClient.invalidateQueries({ queryKey: ['assessment', id] });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: ({
      assessmentId,
      pillarId,
      questionId,
      none,
      disabled,
    }: {
      assessmentId: string;
      pillarId: string;
      questionId: string;
      none?: boolean;
      disabled?: boolean;
    }) =>
      updateQuestion({ assessmentId, pillarId, questionId, none, disabled }),
    onMutate: async ({ pillarId, questionId, none, disabled }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['assessment', id],
      });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(['assessment', id]) as
        | components['schemas']['AssessmentContent']
        | undefined;

      if (!previousData?.pillars) {
        console.log('No previous data found');
        return { previousData };
      }

      // Create a deep copy of the data
      const newData = JSON.parse(
        JSON.stringify(previousData)
      ) as components['schemas']['AssessmentContent'];

      // Find and update the specific question
      let updated = false;
      for (const pillar of newData.pillars || []) {
        if (pillar.id === pillarId) {
          for (const question of pillar.questions || []) {
            if (question.id === questionId) {
              if (none !== undefined) {
                question.none = none;
              }
              if (disabled !== undefined) {
                question.disabled = disabled;
              }
              updated = true;
              break;
            }
          }
        }
        if (updated) break;
      }

      // Update the cache with our optimistic value
      queryClient.setQueryData(['assessment', id], newData);

      // Update local state optimistically if we're viewing the updated question
      if (activeQuestion?.id === questionId) {
        setActiveQuestion({
          ...activeQuestion,
          none: none || activeQuestion.none,
          disabled: disabled || activeQuestion.disabled,
        });
      }

      // Return a context object with the snapshotted value
      return { previousData };
    },
    onError: (_err, _variables, context) => {
      console.log('Error occurred, rolling back to:', context?.previousData);
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousData) {
        queryClient.setQueryData(['assessment', id], context.previousData);

        // Find the current question in the previous data
        if (context.previousData.pillars) {
          const pillar = context.previousData.pillars.find(
            (p) => p.id === selectedPillar?.id
          );
          if (pillar) {
            const question = pillar.questions?.find(
              (q) => q.id === activeQuestion?.id
            );
            if (question) {
              setActiveQuestion(question);
            }
          }
        }
      }
    },
    onSettled: () => {
      console.log('Mutation settled, refetching data');
      // Always refetch after error or success to ensure data is in sync with server
      queryClient.invalidateQueries({ queryKey: ['assessment', id] });
    },
  });

  const rescanAssessmentMutation = useMutation({
    mutationFn: () => rescanAssessment({ assessmentId: id || '' }),
    onMutate: async () => {
      setShowRescanModal(false);
      queryClient.invalidateQueries({ queryKey: ['assessment', id] });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment', id] });
      refetch();
      navigate(`/`);
    },
  });

  const cancelAssessmentMutation = useMutation({
    mutationFn: () => deleteAssessment({ assessmentId: id || '' }),
    onMutate: async () => {
      setShowCancelModal(false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      navigate(`/`);
    },
  });

  const handleNoneQuestion = useCallback(
    (questionId: string, none: boolean) => {
      if (isMilestone) return;
      updateQuestionMutation.mutate({
        assessmentId: id || '',
        pillarId: selectedPillar?.id || '',
        questionId,
        none,
      });
    },
    [id, selectedPillar?.id, updateQuestionMutation, isMilestone]
  );

  const handleDisabledQuestion = useCallback(
    (questionId: string, disabled: boolean) => {
      if (isMilestone) return;
      updateQuestionMutation.mutate({
        assessmentId: id || '',
        pillarId: selectedPillar?.id || '',
        questionId,
        disabled,
      });
    },
    [id, selectedPillar?.id, updateQuestionMutation, isMilestone]
  );

  const handleDisabledPillar = useCallback(
    (pillarId: string, disabled: boolean) => {
      if (isMilestone) return;
      updatePillarMutation.mutate({
        assessmentId: id || '',
        pillarId,
        disabled,
      });
    },
    [id, updatePillarMutation, isMilestone]
  );

  // Add effect to update active question when pillar changes
  useEffect(() => {
    if (selectedPillar?.questions && selectedPillar.questions.length > 0) {
      // If current question is not in the new pillar, reset to first question
      if (!selectedPillar.questions.find((q) => q.id === activeQuestion?.id)) {
        setActiveQuestionIndex(0);
        setActiveQuestion(selectedPillar.questions[0]);
      }
    }
  }, [selectedPillar, activeQuestion?.id]);

  // Add effect to sync active question with cache
  useEffect(() => {
    if (pillars && selectedPillar?.id && activeQuestion?.id) {
      const pillar = pillars.find((p) => p.id === selectedPillar.id);
      if (pillar) {
        const question = pillar.questions?.find(
          (q) => q.id === activeQuestion.id
        );
        if (question) {
          setActiveQuestion(question);
        }
      }
    }
  }, [pillars, selectedPillar?.id, activeQuestion?.id]);

  // Set the first pillar as selected ONLY on initial load
  useEffect(() => {
    if (pillars && pillars.length > 0 && selectedPillarIndex === 0) {
      setSelectedPillar(pillars[0]);
    }
  }, [pillars, selectedPillarIndex]);

  // Set question from the selected indices
  useEffect(() => {
    if (selectedPillar?.questions && selectedPillar.questions.length > 0) {
      // Set initial question index if not already set or if it's out of bounds
      if (activeQuestionIndex >= selectedPillar.questions.length) {
        setActiveQuestionIndex(0);
      }

      // Update active question based on current index
      setActiveQuestion(selectedPillar.questions[activeQuestionIndex]);
    }
  }, [selectedPillar, activeQuestionIndex]);

  const handleUpdateStatus = useCallback(
    (bestPracticeId: string, checked: boolean) => {
      if (!id || !selectedPillar?.id || !activeQuestion?.id || isMilestone) return;

      updateStatusMutation.mutate({
        assessmentId: id,
        pillarId: selectedPillar.id,
        questionId: activeQuestion.id,
        bestPracticeId,
        checked,
      });
    },
    [id, selectedPillar?.id, activeQuestion?.id, updateStatusMutation, isMilestone]
  );

  const columnHelper = createColumnHelper<TableRow>();

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'status',
        header: '',
        size: 60,
        cell: (info) => (
          <div className="ml-5 flex justify-center w-4">
            <input
              type="checkbox"
              className={`checkbox checkbox-sm checkbox-primary`}
              checked={
                activeQuestion?.none && info.row.original.id !== 'resolve'
                  ? false
                  : info.row.original.checked || false
              }
              disabled={
                isMilestone ||
                (activeQuestion?.none && info.row.original.id !== 'resolve')
              }
              onChange={(e) => {
                if (info.row.original.id === 'resolve') {
                  handleNoneQuestion(
                    activeQuestion?.id || '',
                    e.target.checked
                  );
                } else {
                  handleUpdateStatus(
                    info.row.original.id || '',
                    e.target.checked
                  );
                }
              }}
            />
          </div>
        ),
      }),
      columnHelper.accessor('label', {
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 cursor-pointer"
            onClick={() => column.toggleSorting()}
          >
            Best Practice
          </button>
        ),
        cell: (info) => {
          return (
            <div
              tabIndex={0}
              className={`${
                activeQuestion?.none && info.row.original.id !== 'resolve'
                  ? 'line-through text-base-content/50'
                  : ''
              } flex items-center`}
            >
              <div className="p-4 py-3 pr-2 min-h-full flex gap-2 items-center">
                {info.row.original.label}
              </div>
              {info.row.original.description && (
                <button
                  className="cursor-pointer"
                  onClick={() => setBestPracticeDescription(info.row.original)}
                >
                  <InfoIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor('risk', {
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 cursor-pointer"
            onClick={() => column.toggleSorting()}
          >
            Severity
          </button>
        ),
        size: 95,
        cell: (info) => {
          if (info.row.original.id !== 'resolve') {
            return (
              <div
                className={`m-4 mt-3 badge badge-soft badge-sm font-bold ${
                  info.row.original.risk === 'High'
                    ? 'badge-error'
                    : info.row.original.risk === 'Medium'
                    ? 'badge-warning'
                    : 'badge-success'
                }`}
              >
                {info.row.original.risk}
              </div>
            );
          } else {
            return null;
          }
        },
      }),
      columnHelper.accessor((row) => row.results?.length || 0, {
        id: 'failedFindings',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 justify-center w-full cursor-pointer"
            onClick={() => column.toggleSorting()}
          >
            Findings
          </button>
        ),
        size: 80,
        cell: (info) => {
          return (
            <div className="m-4 mt-3 font-bold text-center">
              {info.row.original.results?.length ? (
                <button
                  className="btn btn-link text-error h-[20px]"
                  onClick={() => {
                    setBestPractice(info.row.original);
                  }}
                >
                  {info.row.original.results?.length || '0'}
                </button>
              ) : (
                <div className="text-base-content/50 text-center">-</div>
              )}
            </div>
          );
        },
      }),
    ],
    [
      columnHelper,
      handleUpdateStatus,
      activeQuestion?.none,
      handleNoneQuestion,
      activeQuestion?.id,
      isMilestone,
    ]
  );

  // Helper function to calculate completed questions count
  const calculateCompletedQuestions = (questions: Question[]) => {
    let completedCount = 0;

    // Iterate through each question in the pillar
    for (const question of questions) {
      if (question.disabled) continue;
      // Check if the question has any high severity best practices
      const hasHighSeverityPractices = question.bestPractices?.some(
        (bestPractice) => bestPractice.risk === 'High'
      );

      if (hasHighSeverityPractices) {
        // Check if all high severity best practices in this question have checked true
        const allHighSeverityPracticesComplete =
          question.bestPractices?.every(
            (bestPractice) =>
              bestPractice.risk !== 'High' || bestPractice.checked === true
          ) ?? false;

        if (allHighSeverityPracticesComplete) {
          completedCount++;
        }
      } else {
        completedCount++;
      }
    }

    return completedCount;
  };

  useEffect(() => {
    if (!pillars) return;
    const completedQuestions = pillars.reduce((acc, pillar) => {
      return acc + calculateCompletedQuestions(pillar.questions || []);
    }, 0);
    const totalQuestions = pillars.reduce((acc, pillar) => {
      return acc + (pillar.questions?.filter((q) => !q.disabled).length || 0);
    }, 0);
    setProgress(Math.round((completedQuestions / totalQuestions) * 100));
  }, [pillars]);

  const handleNextQuestion = () => {
    if (!selectedPillar?.questions) return;
    const questions = selectedPillar.questions;
    if (activeQuestionIndex < questions.length - 1) {
      setActiveQuestionIndex(activeQuestionIndex + 1);
    }
  };

  const isLastQuestion = selectedPillar?.questions
    ? activeQuestionIndex === selectedPillar.questions.length - 1
    : false;

  const tableData = useMemo(() => {
    if (!activeQuestion?.bestPractices) return [];
    const res = activeQuestion.bestPractices.map((practice) => ({
      ...practice,
      name: practice.id || '',
    }));
    res.push({
      id: 'resolve',
      label: 'None of the above',
      risk: 'Unknown',
      checked: activeQuestion?.none || false,
      results: [],
      description: '',
      name: 'resolve',
    });
    return res;
  }, [activeQuestion?.bestPractices, activeQuestion?.none]);

  const tabs = useMemo(() => {
    if (!pillars) return [];
    return pillars.map((pillar, index) => ({
      label: `${pillar.label} ${
        pillar.questions
          ? `${calculateCompletedQuestions(pillar.questions)}/${
              pillar.questions.filter((q) => !q.disabled).length
            }`
          : ''
      }`,
      id: pillar.id || `pillar-${index}`,
      disabled: pillar.disabled,
      action: !isMilestone ? (
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
            className="btn btn-ghost btn-xs p-1 pt-[7px]"
          >
            <EllipsisVertical className="w-3 h-3 text-base-content/50" />
          </div>
          <ul
            tabIndex={0}
            className="dropdown-content menu bg-base-100 rounded-box z-50 w-52 p-2 shadow-sm"
          >
            <li>
              <button
                className={`flex flex-row gap-2 w-full text-left ${
                  pillar.disabled ? 'text-base-content' : 'text-error'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDisabledPillar(pillar.id || '', !pillar.disabled);
                }}
              >
                {pillar.disabled ? (
                  <>
                    <CircleCheck className="w-4 h-4" /> Enable this pillar
                  </>
                ) : (
                  <>
                    <CircleMinus className="w-4 h-4" /> Disable this pillar
                  </>
                )}
              </button>
            </li>
          </ul>
        </div>
      ) : undefined,
    }));
  }, [pillars, handleDisabledPillar, isMilestone]);

  const timelineSteps = useMemo(() => {
    return [
      {
        text: 'Scanning your account',
        loading: assessmentData?.step === 'SCANNING_STARTED',
        completed: assessmentData?.step !== 'SCANNING_STARTED',
      },
      {
        text: 'Preparing prompts',
        loading: assessmentData?.step === 'PREPARING_ASSOCIATIONS',
        completed:
          assessmentData?.step !== 'PREPARING_ASSOCIATIONS' &&
          assessmentData?.step !== 'SCANNING_STARTED',
      },
      {
        text: 'Invoking LLMs',
        loading: assessmentData?.step === 'ASSOCIATING_FINDINGS',
        completed:
          assessmentData?.step !== 'ASSOCIATING_FINDINGS' &&
          assessmentData?.step !== 'PREPARING_ASSOCIATIONS' &&
          assessmentData?.step !== 'SCANNING_STARTED',
      },
    ];
  }, [assessmentData?.step]);

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-full">
        <div
          className="w-16 h-16 loading loading-ring loading-lg text-primary"
          role="status"
        ></div>
      </div>
    );

  const details = (
    <>
      {!isMilestone && (
        <div
          className=" w-full fixed top-16 left-0 w-full h-1 flex flex-row items-center tooltip tooltip-bottom"
          data-tip={`${progress}% completed`}
        >
          <progress
            className={`progress w-full rounded-none h-1 ${
              progress === 100 ? 'progress-success' : 'progress-primary'
            }`}
            value={progress}
            max="100"
          ></progress>
        </div>
      )}

      <div className="flex flex-row gap-2 justify-between">
        <div className="prose mb-2 w-full flex flex-col gap-2">
          <h2 className="mt-0 mb-0">Assessment {assessmentData?.name}</h2>
          { isMilestone && (
            <h3 className="text-base-content/50 text-sm">
              Milestone {milestoneData?.name}
            </h3>
          )}
          <div className="text-sm text-base-content/50 font-bold"></div>
        </div>
        <div className="flex flex-row gap-2 items-center">
          {!isMilestone && <StatusBadge status={assessmentData?.step || undefined} />}
          {!isMilestone && (
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
                <EllipsisVertical className="w-4 h-4 text-base-content/80" />
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content menu bg-base-100 rounded-box z-50 w-52 p-2 shadow-sm"
              >
                <li>
                  <button
                    className="flex flex-row gap-2 w-full text-left"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowRescanModal(true);
                    }}
                  >
                    <RefreshCw className="w-4 h-4" /> Rescan
                  </button>
                </li>
                <li className="m-1"></li>
                <li>
                  <ExportToAWSDialog assessmentId={id ?? ''} askForRegion={!assessmentData?.exportRegion} />
                </li>
                <li>
                  <CreateAWSMilestoneDialog assessmentId={id ?? ''} disabled={!assessmentData?.exportRegion} />
                </li>
                <li>
                  <ListAWSMilestonesDialog assessmentId={id ?? ''} disabled={!assessmentData?.exportRegion} />
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
      <Tabs
        tabs={tabs}
        activeTab={selectedPillar?.id || ''}
        onChange={(tabId) => {
          const index = pillars?.findIndex((p) => p.id === tabId) ?? 0;
          setSelectedPillarIndex(index);
          setSelectedPillar(pillars?.[index] || null);
          setActiveQuestionIndex(0);
        }}
      />
      <div className="flex flex-1 flex-row overflow-auto my-4 rounded-lg border border-neutral-content shadow-md">
        {selectedPillar?.disabled && (
          <div className="flex flex-row gap-2 items-center justify-between p-8 w-full">
            <h3 className="text-center font-medium text-xl  flex-1">
              This pillar is disabled
            </h3>
          </div>
        )}
        {!selectedPillar?.disabled && (
          <>
            <VerticalMenu
              items={(selectedPillar?.questions || [])
                .sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0))
                .map((question, index) => {
                  // Find the latest question data from the cache
                  const latestQuestion =
                    pillars
                      ?.find((p) => p.id === selectedPillar?.id)
                      ?.questions?.find((q) => q.id === question.id) ||
                    question;

                  return {
                    text: question.label || '',
                    id: question.id || `question-${index}`,
                    active: activeQuestionIndex === index,
                    onClick: () => setActiveQuestionIndex(index),
                    completed:
                      latestQuestion.bestPractices?.every(
                        (bestPractice) =>
                          bestPractice.risk !== 'High' ||
                          bestPractice.checked === true
                      ) ?? false,
                    started:
                      latestQuestion.bestPractices?.some(
                        (bestPractice) => bestPractice.checked
                      ) ?? false,
                    error: latestQuestion.none,
                    disabled: latestQuestion.disabled,
                  };
                })}
            />

            <div className="flex-1 bg-primary/5 px-8 py-4 flex flex-col gap-4">
              <div className="bg-base-100 p-4 py-2 rounded-lg flex flex-row gap-2 items-center justify-between">
                <h3 className="text-center font-medium text-lg text-primary flex-1">
                  <span className="font-medium">
                    {selectedPillar?.questions
                      ? `${activeQuestionIndex + 1} / ${
                          selectedPillar.questions.length
                        }`
                      : ''}
                  </span>
                  {'. '}
                  <span className="font-light">{activeQuestion?.label}</span>
                </h3>
                <div>
                  {!isLastQuestion && !isMilestone && (
                    <div
                      tabIndex={0}
                      role="button"
                      className="btn btn-ghost btn-xs p-1"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleNextQuestion();
                      }}
                    >
                      <ChevronRight className="w-4 h-4 text-base-content/80" />
                    </div>
                  )}
                  {!isMilestone && (
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
                        <EllipsisVertical className="w-4 h-4 text-base-content/80" />
                      </div>
                      <ul
                        tabIndex={0}
                        className="dropdown-content menu bg-base-100 rounded-box z-50 w-52 p-2 shadow-sm"
                      >
                        <li>
                          <button
                            className={`flex flex-row gap-2 w-full text-left ${
                              activeQuestion?.disabled
                                ? 'text-base-content'
                                : 'text-error'
                            }`}
                            onClick={() => {
                              handleDisabledQuestion(
                                activeQuestion?.id || '',
                                !activeQuestion?.disabled
                              );
                            }}
                          >
                            {activeQuestion?.disabled ? (
                              <>
                                <CircleCheck className="w-4 h-4" /> Enable this
                                question
                              </>
                            ) : (
                              <>
                                <CircleMinus className="w-4 h-4" /> Disable this
                                question
                              </>
                            )}
                          </button>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              {activeQuestion?.disabled && (
                <div className="flex flex-row gap-2 items-center justify-between p-8">
                  <h3 className="text-center font-medium text-xl  flex-1">
                    This question is disabled
                  </h3>
                </div>
              )}
              {!activeQuestion?.disabled && (
                <div className="overflow-x-auto rounded-box border border-base-content/5 bg-base-100">
                  {activeQuestion && (
                    <DataTable
                      key={`${selectedPillar?.id}-${activeQuestion.id}`}
                      data={tableData}
                      columns={columns}
                    />
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );

  const loading = (
    <>
      <div className="flex items-center justify-center h-full w-full flex-col prose max-w-none">
        <h2 className="text-center text-primary font-light mb-0 ">
          Your assessment is processing
        </h2>
        <Timeline steps={timelineSteps} />
        <button
          className="btn btn-error btn-sm text-sm h-8 min-h-8 mt-5 text-white"
          onClick={() => setShowCancelModal(true)}
        >
          Cancel Assessment
        </button>
      </div>
      {showCancelModal && (
        <ConfirmationModal
          open={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          onCancel={() => setShowCancelModal(false)}
          onConfirm={() => cancelAssessmentMutation.mutate()}
          title="Cancel Assessment"
          message="Are you sure you want to cancel this assessment? This action cannot be undone."
        />
      )}
    </>
  );

  if (!id) return <div>No assessment ID found</div>;
  return (
    <div className="container py-8 pt-2 overflow-auto flex-1 flex flex-col relative">
      <div className="breadcrumbs text-sm shrink-0">
        <ul>
          {[
            { label: 'Home', to: '/' },
            { label: `Assessment ${assessmentData?.name}`, to: `/assessments/${assessmentData?.id}` },
            ...(isMilestone ? [{ label: `Milestone ${milestoneData?.name}`, to: `/assessments/${assessmentData?.id}/milestones/${milestoneData?.id}` }] : []),
          ].map((item, index, array) => (
            <li key={index}>
              {index !== array.length - 1
                ? <Link to={item.to}>{item.label}</Link>
                : item.label}
            </li>
          ))}
        </ul>
      </div>

      {!isMilestone && (assessmentData?.step === 'SCANNING_STARTED' ||
      assessmentData?.step === 'PREPARING_ASSOCIATIONS' ||
      assessmentData?.step === 'ASSOCIATING_FINDINGS')
        ? loading
        : null}
      {(isMilestone || assessmentData?.step === 'FINISHED') ? details : null}
      {!isMilestone && assessmentData?.step === 'ERRORED' ? <ErrorPage {...assessmentData} /> : null}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-16 h-16 loading loading-ring loading-lg text-primary"
            role="status"
          ></div>
        </div>
      )}
      {bestPractice && (
        <FindingsDetails
          assessmentId={id}
          pillarId={selectedPillar?.id || ''}
          questionId={activeQuestion?.id || ''}
          bestPractice={bestPractice}
          setBestPractice={setBestPractice}
        />
      )}
      {bestPracticeDescription && (
        <Modal
          open={true}
          onClose={() => setBestPracticeDescription(null)}
          className="w-full max-w-6xl"
        >
          <div className="flex flex-col gap-2 prose max-w-none p-6">
            <h3>{bestPracticeDescription.label}</h3>
            {bestPracticeDescription.description}
          </div>
        </Modal>
      )}
      {showRescanModal && (
        <ConfirmationModal
          open={showRescanModal}
          onClose={() => setShowRescanModal(false)}
          onCancel={() => setShowRescanModal(false)}
          onConfirm={() => rescanAssessmentMutation.mutate()}
          title="Rescan Assessment"
          message="Are you sure you want to rescan the assessment? This might take a while."
        />
      )}
    </div>
  );
}

export default AssessmentDetails;
