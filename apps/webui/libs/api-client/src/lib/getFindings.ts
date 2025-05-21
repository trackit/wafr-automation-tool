import { apiClient } from './client';
import { paths } from '@shared/api-schema';

export const getFindings = async (
  assessmentId: string,
  pillarId: string,
  questionId: string,
  bestPracticeId: string
) => {
  return apiClient.get<
    paths['/assessments/{assessmentId}/pillars/{pillarId}/questions/{questionId}/best-practices/{bestPracticeId}']['get']['responses']['200']['content']['application/json']
  >(
    `/assessments/${assessmentId}/pillars/${pillarId}/questions/${questionId}/best-practices/${bestPracticeId}`
  );
};
