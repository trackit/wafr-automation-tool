import { type paths } from '@shared/api-schema';

import { apiClient } from './client';
export const updateStatus = async (
  assessmentId: string,
  pillarId: string,
  questionId: string,
  bestPracticeId: string,
  checked: boolean,
): Promise<
  paths['/assessments/{assessmentId}/pillars/{pillarId}/questions/{questionId}/best-practices/{bestPracticeId}']['put']['responses']['200']['content']
> => {
  return apiClient.put(
    `/assessments/${assessmentId}/pillars/${pillarId}/questions/${questionId}/best-practices/${bestPracticeId}`,
    {
      checked,
    },
  );
};
