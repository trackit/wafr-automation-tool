import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, VerticalMenu, BestPracticeTable } from '@webui/ui';
import { getAssessment, updateStatus } from '@webui/api-client';
import { components } from '@webui/types';
import { ArrowRight } from 'lucide-react';

type BestPractice = components['schemas']['BestPractice'];
type Question = Record<string, { [key: string]: BestPractice }>;
type Pillar = Record<string, Question>;

const assessmentId = '1742328326706';

export function AssessmentDetails() {
  const queryClient = useQueryClient();
  const [selectedPillarKey, setSelectedPillarKey] = useState<string>('');
  const [selectedPillar, setSelectedPillar] = useState<Pillar | null>(null);
  const [activeQuestionKey, setActiveQuestionKey] = useState<string>('');
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const updateStatusMutation = useMutation({
    mutationFn: ({
      assessmentId,
      bestPractice,
      status,
    }: {
      assessmentId: string;
      bestPractice: string;
      status: boolean;
    }) => updateStatus(assessmentId, bestPractice, status),
    onMutate: async ({ assessmentId, bestPractice, status }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['assessment', assessmentId],
      });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData([
        'assessment',
        assessmentId,
      ]) as components['schemas']['AssessmentContent'] | undefined;

      if (!previousData?.findings) {
        console.log('No previous data found');
        return { previousData };
      }

      // Create a deep copy of the data
      const newData = JSON.parse(
        JSON.stringify(previousData)
      ) as components['schemas']['AssessmentContent'];
      const findings = newData.findings as Record<string, Pillar>;

      // Find and update the specific best practice
      let updated = false;
      for (const pillarKey of Object.keys(findings)) {
        const pillar = findings[pillarKey] as Record<string, Question>;
        for (const questionKey of Object.keys(pillar)) {
          const question = pillar[questionKey] as Record<string, BestPractice>;
          if (bestPractice in question) {
            console.log('Found best practice to update in:', {
              pillarKey,
              questionKey,
            });
            question[bestPractice] = {
              ...question[bestPractice],
              status,
            };
            updated = true;
            break;
          }
        }
        if (updated) break;
      }

      // Update the cache with our optimistic value
      queryClient.setQueryData(['assessment', assessmentId], newData);

      // Return a context object with the snapshotted value
      return { previousData };
    },
    onError: (_err, _variables, context) => {
      console.log('Error occurred, rolling back to:', context?.previousData);
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousData) {
        queryClient.setQueryData(
          ['assessment', assessmentId],
          context.previousData
        );
      }
    },
    onSettled: () => {
      console.log('Mutation settled, refetching data');
      // Always refetch after error or success to ensure data is in sync with server
      queryClient.invalidateQueries({ queryKey: ['assessment', assessmentId] });
    },
  });

  const handleUpdateStatus = (bestPractice: string, status: boolean) => {
    updateStatusMutation.mutate({
      assessmentId,
      bestPractice,
      status,
    });
  };

  // Helper function to extract AWS account ID from role ARN
  const extractAccountId = (roleArn: string | undefined) => {
    if (!roleArn) return '';
    const match = roleArn.match(/arn:aws:iam::(\d+):/);
    return match ? match[1] : '';
  };

  // Helper function to calculate completed questions count
  const calculateCompletedQuestions = (pillarData: Question) => {
    let completedCount = 0;

    // Iterate through each question in the pillar
    for (const question of Object.values(pillarData)) {
      // Check if all best practices in this question have status true
      const allBestPracticesComplete = Object.values(question).every(
        (bestPractice) => bestPractice.status === true
      );
      if (allBestPracticesComplete) {
        completedCount++;
      }
    }

    return completedCount;
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['assessment', assessmentId],
    queryFn: () => getAssessment(assessmentId),
  });

  // Set the first pillar key as the selected pillar key ONLY on initial load
  useEffect(() => {
    if (data?.findings && !selectedPillarKey) {
      const pillars = data.findings as Record<string, Pillar>;
      if (pillars && Object.keys(pillars).length > 0) {
        const firstPillarKey = Object.keys(pillars)[0];
        setSelectedPillarKey(firstPillarKey);
      }
    }
  }, [data?.findings, selectedPillarKey]);

  // Set pillar and question from the selected keys
  useEffect(() => {
    if (data?.findings && selectedPillarKey) {
      const pillars = data.findings as Record<string, Pillar>;
      setSelectedPillar(pillars[selectedPillarKey]);

      // Set initial question key if not already set or if it doesn't exist in current pillar
      const currentQuestions = pillars[selectedPillarKey];
      if (!activeQuestionKey || !(activeQuestionKey in currentQuestions)) {
        const questionKeys = Object.keys(currentQuestions);
        setActiveQuestionKey(questionKeys[0]);
      }

      // Always update active question based on current keys
      if (pillars[selectedPillarKey]) {
        setActiveQuestion(pillars[selectedPillarKey][activeQuestionKey]);
      }
    }
  }, [data?.findings, selectedPillarKey, activeQuestionKey]);

  // Create dynamic tabs from findings data
  const tabs = data?.findings
    ? Object.entries(data.findings as Record<string, Pillar>).map(
        ([pillar, questions]) => ({
          label: `${pillar} ${
            questions
              ? `${calculateCompletedQuestions(questions)}/${
                  Object.keys(questions).length
                }`
              : ''
          }`,
          id: pillar,
        })
      )
    : [];

  const handleNextQuestion = () => {
    if (!selectedPillar) return;
    const questions = Object.keys(selectedPillar);
    const currentIndex = questions.indexOf(activeQuestionKey);
    if (currentIndex < questions.length - 1) {
      setActiveQuestionKey(questions[currentIndex + 1]);
    }
  };

  const isLastQuestion = selectedPillar
    ? Object.keys(selectedPillar).indexOf(activeQuestionKey) ===
      Object.keys(selectedPillar).length - 1
    : false;

  return (
    <div className="container py-8 overflow-auto flex-1 flex flex-col">
      <div className="prose mb-2 w-full">
        <h2 className="mt-0">
          Assessment - {data?.name}{' '}
          <span className="text-sm text-base-content/50">
            ({extractAccountId(data?.role_arn)})
          </span>
        </h2>
      </div>
      <Tabs
        tabs={tabs}
        activeTab={selectedPillarKey}
        onChange={(tab) => {
          setSelectedPillarKey(tab);
        }}
      />
      <div className="flex-1 flex flex-row overflow-auto  my-4 rounded-lg border border-neutral-content shadow-md ">
        <VerticalMenu
          items={Object.keys(selectedPillar || {}).map((question) => ({
            text: question,
            id: question,
            active: activeQuestionKey === question,
            onClick: () => setActiveQuestionKey(question),
          }))}
        />
        <div className="flex-1 bg-primary/5 p-8 flex flex-col gap-4">
          <div className="bg-base-100 p-4 rounded-lg">
            <h3 className="text-center font-medium text-xl text-primary">
              <span className="font-medium">
                {selectedPillar
                  ? `${
                      Object.keys(selectedPillar).indexOf(activeQuestionKey) + 1
                    } / ${Object.keys(selectedPillar).length}`
                  : ''}
              </span>
              {'. '}
              <span className="font-light">{activeQuestionKey}</span>
            </h3>
          </div>
          <div className="overflow-x-auto rounded-box border border-base-content/5 bg-base-100">
            {activeQuestion && (
              <BestPracticeTable
                key={`${selectedPillarKey}-${activeQuestionKey}`}
                bestPractices={activeQuestion}
                onUpdateStatus={handleUpdateStatus}
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
    </div>
  );
}

export default AssessmentDetails;
