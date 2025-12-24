import { type paths } from '@shared/api-schema';

import { apiClient } from './client';

export const getFindings = async (
  assessmentId: string,
  assessmentVersion: number,
  pillarId: string,
  questionId: string,
  bestPracticeId: string,
  limit: number | undefined = undefined,
  search: string | undefined = undefined,
  showHidden: boolean | undefined = undefined,
  nextToken: string | undefined = undefined,
) => {
  const params = new URLSearchParams();
  if (limit) params.set('limit', limit.toString());
  if (search) params.set('search', search);
  if (showHidden) params.set('showHidden', 'true');
  if (nextToken) params.set('nextToken', nextToken);

  return apiClient.get<
    paths['/assessments/{assessmentId}/versions/{version}/pillars/{pillarId}/questions/{questionId}/best-practices/{bestPracticeId}']['get']['responses']['200']['content']['application/json']
  >(
    `/assessments/${assessmentId}/versions/${assessmentVersion}/pillars/${pillarId}/questions/${questionId}/best-practices/${bestPracticeId}?${params.toString()}`,
  );
};
