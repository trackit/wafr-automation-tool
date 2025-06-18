import { paths } from '@shared/api-schema';
import { apiClient } from './client';

export const getFindings = async (
  assessmentId: string,
  pillarId: string,
  questionId: string,
  bestPracticeId: string,
  limit: number | undefined = undefined,
  search: string | undefined = undefined,
  showHidden: boolean | undefined = undefined,
  nextToken: string | undefined = undefined
) => {
  const params = new URLSearchParams();
  if (limit) params.set('limit', limit.toString());
  if (search) params.set('search', search);
  if (showHidden) params.set('show_hidden', 'true');
  if (nextToken) params.set('next_token', nextToken);

  return apiClient.get<
    paths['/assessments/{assessmentId}/pillars/{pillarId}/questions/{questionId}/best-practices/{bestPracticeId}']['get']['responses']['200']['content']['application/json']
  >(
    `/assessments/${assessmentId}/pillars/${pillarId}/questions/${questionId}/best-practices/${bestPracticeId}?${params.toString()}`
  );
};
