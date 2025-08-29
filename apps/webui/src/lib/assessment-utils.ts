import { components } from '@shared/api-schema';

type Question = components['schemas']['Question'];
type Pillar = components['schemas']['Pillar'];
type AssessmentContent = components['schemas']['AssessmentContent'];

/**
 * Calculates whether a question is completed based on its best practices
 * A question is considered complete if:
 * - It has no high severity best practices, OR
 * - All high severity best practices are checked as true
 */
export function isQuestionCompleted(question: Question): boolean {
  if (question.disabled) return false;

  // Check if the question has any high severity best practices
  const hasHighSeverityPractices = question.bestPractices?.some(
    (bestPractice) => bestPractice.risk === 'High'
  );

  if (hasHighSeverityPractices) {
    // Check if all high severity best practices in this question have checked true
    return (
      question.bestPractices?.every(
        (bestPractice) =>
          bestPractice.risk !== 'High' || bestPractice.checked === true
      ) ?? false
    );
  } else {
    // If no high severity practices, question is complete
    return true;
  }
}

/**
 * Calculates the completion percentage for a specific pillar
 */
export function calculatePillarCompletion(pillar: Pillar): number {
  const questions = pillar.questions || [];
  const totalQuestions = questions.filter((q) => !q.disabled).length;

  if (totalQuestions === 0) {
    return 100;
  }

  const completedQuestions = questions.filter((q) =>
    isQuestionCompleted(q)
  ).length;
  return Math.round((completedQuestions / totalQuestions) * 100);
}

/**
 * Calculates the overall completion percentage for an assessment
 */
export function calculateOverallCompletion(
  assessment: AssessmentContent | null
): number {
  if (!assessment?.pillars) return 0;

  let completedQuestions = 0;
  let totalQuestions = 0;

  for (const pillar of assessment.pillars) {
    if (pillar.disabled) continue;

    const questions = pillar.questions || [];
    for (const question of questions) {
      if (question.disabled) continue;

      totalQuestions++;
      if (isQuestionCompleted(question)) {
        completedQuestions++;
      }
    }
  }

  return totalQuestions > 0
    ? Math.round((completedQuestions / totalQuestions) * 100)
    : 0;
}

/**
 * Calculates the completed questions count for a specific pillar
 */
export function calculateCompletedQuestionsCount(
  questions: Question[]
): number {
  let completedCount = 0;

  for (const question of questions) {
    if (question.disabled) continue;

    if (isQuestionCompleted(question)) {
      completedCount++;
    }
  }

  return completedCount;
}

/**
 * Extracts account ID from a role ARN
 */
export function extractAccountId(roleArn: string | undefined): string {
  if (!roleArn) return '';
  const match = roleArn.match(/arn:aws:iam::(\d+):/);
  return match ? match[1] : '';
}

/**
 * Formats workflow information for display
 */
export function formatWorkflowInfo(
  workflows: string[] | string | undefined
): string {
  if (Array.isArray(workflows)) {
    return workflows.length ? workflows.join(', ') : '-';
  }
  return workflows || '-';
}

/**
 * Formats date for display
 */
export function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
}

/**
 * Formats regions for display
 */
export function formatRegions(regions: string[] | undefined): string {
  return regions?.join(', ') || 'Global';
}
