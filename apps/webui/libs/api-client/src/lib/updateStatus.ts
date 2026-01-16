import { type operations } from '@shared/api-schema';

import { apiClient } from './client';
export const updateStatus = async (
  assessmentId: string,
  pillarId: string,
  questionId: string,
  bestPracticeId: string,
  checked: boolean,
): Promise<operations['updateBestPractice']['responses']['200']['content']> => {
  return apiClient.put(
    `/assessments/${assessmentId}/pillars/${pillarId}/questions/${questionId}/best-practices/${bestPracticeId}`,
    {
      checked,
    },
  );
};
