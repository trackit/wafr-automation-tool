import { apiClient } from './client';
import { paths } from '@webui/types';
export const updateStatus = async (
  assessmentId: string,
  pillarId: string,
  questionId: string,
  bestPracticeId: string,
  status: boolean
) => {
  return apiClient.put<
    paths['/assessments/{assessmentId}/pillars/{pillarId}/questions/{questionId}/best-practices/{bestPracticeId}/{status}']['put']['responses']['200']['content']
  >(
    `/assessments/${assessmentId}/pillars/${pillarId}/questions/${questionId}/best-practices/${bestPracticeId}/${status}`,
    {}
  );
};
