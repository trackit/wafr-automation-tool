import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, VerticalMenu, BestPracticeTable } from '@webui/ui';
import { getAssessment } from '@webui/api-client';
import { components } from '@webui/types';

type BestPractice = components['schemas']['BestPractice'];
type Question = Record<string, { [key: string]: BestPractice }>;
type Pillar = Record<string, Question>;

export function AssessmentDetails() {
  const [selectedPillarKey, setSelectedPillarKey] = useState<string>('');
  const [selectedPillar, setSelectedPillar] = useState<Pillar | null>(null);
  const [activeQuestionKey, setActiveQuestionKey] = useState<string>('id1');
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);

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
    queryKey: ['assessment', '1742328326706'],
    queryFn: () => getAssessment('1742328326706'),
  });

  // Set the first pillar key as the selected pillar key
  useEffect(() => {
    // console.log(data);
    if (data?.findings) {
      const pillars = data.findings as Record<string, Pillar>;
      if (pillars && Object.keys(pillars).length > 0 && !selectedPillarKey) {
        const firstPillarKey = Object.keys(pillars)[0];
        setSelectedPillarKey(firstPillarKey);
      }
    }
  }, [data, selectedPillarKey]);

  // Set pillar from the selected pillar key
  useEffect(() => {
    if (data?.findings && selectedPillarKey && selectedPillarKey !== '') {
      const pillars = data.findings as Record<string, Pillar>;
      setSelectedPillar(pillars[selectedPillarKey]);
      const questions = pillars[selectedPillarKey];
      const questionKeys = Object.keys(questions);
      setActiveQuestionKey(questionKeys[0]);
      // console.log(pillars[selectedPillarKey]);
    }
  }, [data, selectedPillarKey]);

  // Set active question from the active question key
  useEffect(() => {
    if (selectedPillar && activeQuestionKey) {
      setActiveQuestion(selectedPillar[activeQuestionKey]);
    }
  }, [selectedPillar, activeQuestionKey]);

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

  return (
    <div className="container py-8 overflow-auto flex-1 flex flex-col">
      <div className="prose mb-4">
        <h2 className="mt-0">Assessment 01 - Client</h2>
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
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AssessmentDetails;
