import { paths } from '@shared/api-schema';
import { apiClient } from './client';
export const updateStatus = async (
  assessmentId: string,
  pillarId: string,
  questionId: string,
  bestPracticeId: string,
  checked: boolean
) => {
  return apiClient.put<
    paths['/assessments/{assessmentId}/pillars/{pillarId}/questions/{questionId}/best-practices/{bestPracticeId}']['put']['responses']['200']['content']
  >(
    `/assessments/${assessmentId}/pillars/${pillarId}/questions/${questionId}/best-practices/${bestPracticeId}`,
    {
      checked,
    }
  );
};
