import { useEffect, useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, VerticalMenu, DataTable, Modal, StatusBadge } from '@webui/ui';
import { getAssessment, updateStatus } from '@webui/api-client';
import { components } from '@webui/types';
import { ArrowRight } from 'lucide-react';
import { createColumnHelper } from '@tanstack/react-table';
import { Link, useParams } from 'react-router';
import FindingsDetails from './findings-details';

type BestPractice = components['schemas']['BestPractice'];
type Question = components['schemas']['Question'];
type Pillar = components['schemas']['Pillar'];
type TableRow = BestPractice & { name: string };

export function AssessmentDetails() {
  const queryClient = useQueryClient();
  const [selectedPillarIndex, setSelectedPillarIndex] = useState<number>(0);
  const [selectedPillar, setSelectedPillar] = useState<Pillar | null>(null);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [bestPractice, setBestPractice] = useState<BestPractice | null>(null);
  const { id } = useParams();

  const updateStatusMutation = useMutation({
    mutationFn: ({
      assessmentId,
      pillarId,
      questionId,
      bestPracticeId,
      status,
    }: {
      assessmentId: string;
      pillarId: string;
      questionId: string;
      bestPracticeId: string;
      status: boolean;
    }) =>
      updateStatus(assessmentId, pillarId, questionId, bestPracticeId, status),
    onMutate: async ({ pillarId, questionId, bestPracticeId, status }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['assessment', id],
      });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(['assessment', id]) as
        | components['schemas']['AssessmentContent']
        | undefined;

      if (!previousData?.findings) {
        console.log('No previous data found');
        return { previousData };
      }

      // Create a deep copy of the data
      const newData = JSON.parse(
        JSON.stringify(previousData)
      ) as components['schemas']['AssessmentContent'];

      // Find and update the specific best practice using all IDs
      let updated = false;
      for (const pillar of newData.findings || []) {
        if (pillar.id === pillarId) {
          for (const question of pillar.questions || []) {
            if (question.id === questionId) {
              for (const practice of question.best_practices || []) {
                if (practice.id === bestPracticeId) {
                  practice.status = status;
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

      // Update local state optimistically
      if (
        selectedPillar?.id === pillarId &&
        activeQuestion?.id === questionId
      ) {
        const updatedBestPractices = activeQuestion.best_practices?.map(
          (practice) =>
            practice.id === bestPracticeId ? { ...practice, status } : practice
        );
        setActiveQuestion({
          ...activeQuestion,
          best_practices: updatedBestPractices,
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
        // Also roll back local state
        if (data?.findings) {
          const pillar = data.findings[selectedPillarIndex];
          if (pillar) {
            setSelectedPillar(pillar);
            if (pillar.questions && pillar.questions[activeQuestionIndex]) {
              setActiveQuestion(pillar.questions[activeQuestionIndex]);
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

  const handleUpdateStatus = useCallback(
    (bestPracticeId: string, status: boolean) => {
      if (!id || !selectedPillar?.id || !activeQuestion?.id) return;

      updateStatusMutation.mutate({
        assessmentId: id,
        pillarId: selectedPillar.id,
        questionId: activeQuestion.id,
        bestPracticeId,
        status,
      });
    },
    [id, selectedPillar?.id, activeQuestion?.id, updateStatusMutation]
  );

  const columnHelper = createColumnHelper<TableRow>();

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'status',
        header: '',
        cell: (info) => (
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              className={`checkbox checkbox-sm ${
                info.row.original.status
                  ? 'checkbox-success'
                  : 'checkbox-primary'
              }`}
              checked={info.row.original.status || false}
              readOnly
              onChange={(e) =>
                handleUpdateStatus(info.row.original.id || '', e.target.checked)
              }
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
        cell: (info) => {
          return (
            <div
              className={`badge badge-soft badge-sm font-bold ${
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
        },
      }),
      columnHelper.accessor((row) => row.results?.length || 0, {
        id: 'failedFindings',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 justify-center w-full cursor-pointer"
            onClick={() => column.toggleSorting()}
          >
            Failed Findings
          </button>
        ),
        cell: (info) => {
          return (
            <div className="font-bold text-center">
              {info.row.original.results?.length ? (
                <button
                  className="btn btn-link text-error"
                  onClick={() => {
                    setBestPractice(info.row.original);
                  }}
                >
                  {info.row.original.results?.length || 0}
                </button>
              ) : (
                <div className="text-base-content/50 text-center">0</div>
              )}
            </div>
          );
        },
      }),
    ],
    [columnHelper, handleUpdateStatus]
  );

  // Helper function to extract AWS account ID from role ARN
  const extractAccountId = (roleArn: string | undefined) => {
    if (!roleArn) return '';
    const match = roleArn.match(/arn:aws:iam::(\d+):/);
    return match ? match[1] : '';
  };

  // Helper function to calculate completed questions count
  const calculateCompletedQuestions = (questions: Question[]) => {
    let completedCount = 0;

    // Iterate through each question in the pillar
    for (const question of questions) {
      // Check if the question has any high severity best practices
      const hasHighSeverityPractices = question.best_practices?.some(
        (bestPractice) => bestPractice.risk === 'High'
      );

      if (hasHighSeverityPractices) {
        // Check if all high severity best practices in this question have status true
        const allHighSeverityPracticesComplete =
          question.best_practices?.every(
            (bestPractice) =>
              bestPractice.risk !== 'High' || bestPractice.status === true
          ) ?? false;

        if (allHighSeverityPracticesComplete) {
          completedCount++;
        }
      }
    }

    return completedCount;
  };

  const { data, isLoading } = useQuery({
    queryKey: ['assessment', id],
    queryFn: () => (id ? getAssessment(id) : null),
    refetchInterval: 30000,
  });

  // Set the first pillar as selected ONLY on initial load
  useEffect(() => {
    if (
      data?.findings &&
      data.findings.length > 0 &&
      selectedPillarIndex === 0
    ) {
      setSelectedPillar(data.findings[0]);
    }
  }, [data?.findings, selectedPillarIndex]);

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
    if (!activeQuestion?.best_practices) return [];
    return activeQuestion.best_practices.map((practice) => ({
      ...practice,
      name: practice.id || '',
    }));
  }, [activeQuestion]);

  const tabs = useMemo(() => {
    if (!data?.findings) return [];
    return data.findings.map((pillar, index) => ({
      label: `${pillar.label} ${
        pillar.questions
          ? `${calculateCompletedQuestions(pillar.questions)}/${
              pillar.questions.length
            }`
          : ''
      }`,
      id: pillar.id || `pillar-${index}`,
    }));
  }, [data?.findings]);

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-16 h-16 loading loading-ring loading-lg text-primary"></div>
      </div>
    );

  const details = (
    <>
      <div className="flex flex-row gap-2 justify-between">
        <div className="prose mb-2 w-full flex flex-col gap-2">
          <h2 className="mt-0 mb-0">Assessment {data?.name} </h2>
          <div className="text-sm text-base-content/50 font-bold"></div>
        </div>
        <div className="flex flex-row gap-2">
          <div className={'badge badge-info badge-soft font-bold '}>
            Account:
            {data?.role_arn && <>{extractAccountId(data?.role_arn)}</>}
          </div>
          <StatusBadge status={data?.step || undefined} />
        </div>
      </div>
      <Tabs
        tabs={tabs}
        activeTab={selectedPillar?.id || ''}
        onChange={(tabId) => {
          const index = data?.findings?.findIndex((p) => p.id === tabId) ?? 0;
          setSelectedPillarIndex(index);
          setSelectedPillar(data?.findings?.[index] || null);
        }}
      />
      <div className="flex-1 flex flex-row overflow-auto my-4 rounded-lg border border-neutral-content shadow-md">
        <VerticalMenu
          items={(selectedPillar?.questions || []).map((question, index) => ({
            text: question.label || '',
            id: question.id || `question-${index}`,
            active: activeQuestionIndex === index,
            onClick: () => setActiveQuestionIndex(index),
            completed:
              question.best_practices?.every(
                (bestPractice) =>
                  bestPractice.risk !== 'High' || bestPractice.status === true
              ) ?? false,
            started:
              question.best_practices?.some(
                (bestPractice) => bestPractice.status
              ) ?? false,
          }))}
        />
        <div className="flex-1 bg-primary/5 p-8 flex flex-col gap-4">
          <div className="bg-base-100 p-4 rounded-lg">
            <h3 className="text-center font-medium text-xl text-primary">
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
          </div>
          <div className="overflow-x-auto rounded-box border border-base-content/5 bg-base-100">
            {activeQuestion && (
              <DataTable
                key={`${selectedPillar?.id}-${activeQuestion.id}`}
                data={tableData}
                columns={columns}
              />
            )}
          </div>
          {!isLastQuestion && (
            <div className="flex flex-row gap-2 justify-end mt-auto">
              <button
                className="btn btn-link no-underline"
                onClick={handleNextQuestion}
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );

  const loading = (
    <div className="flex items-center justify-center h-full w-full flex-col prose max-w-none">
      <div className="w-16 h-16 loading loading-ring loading-lg text-primary"></div>
      <h2 className="text-center text-primary font-light mt-4">
        {data?.step === 'SCANNING_STARTED'
          ? 'Scanning your account...'
          : data?.step === 'PREPARING_PROMPTS'
          ? 'Preparing prompts...'
          : 'Invoking LLMs...'}
      </h2>
    </div>
  );

  if (!id) return <div>No assessment ID found</div>;
  return (
    <div className="container py-8 pt-2 overflow-auto flex-1 flex flex-col relative">
      <div className="breadcrumbs text-sm">
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>Assessment {data?.name}</li>
        </ul>
      </div>

      {data?.step === 'SCANNING_STARTED' ||
      data?.step === 'PREPARING_PROMPTS' ||
      data?.step === 'INVOKING_LLM'
        ? loading
        : null}
      {data?.step === 'FINISHED' ? details : null}
      {data?.step === 'ERRORED' ? (
        <div className="flex items-center justify-center h-full">
          <h2 className="text-center text-error font-bold">
            An error occurred while running the assessment. Please try again.
          </h2>
        </div>
      ) : null}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 loading loading-ring loading-lg text-primary"></div>
        </div>
      )}
      {bestPractice && (
        <Modal
          open={true}
          onClose={() => setBestPractice(null)}
          className="w-full max-w-6xl"
          notCentered
        >
          <FindingsDetails
            assessmentId={id}
            pillarId={selectedPillar?.id || ''}
            questionId={activeQuestion?.id || ''}
            bestPractice={bestPractice}
          />
        </Modal>
      )}
    </div>
  );
}

export default AssessmentDetails;
