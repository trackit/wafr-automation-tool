import { type operations } from '@shared/api-schema';

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
): Promise<
  operations['getBestPracticeFindings']['responses']['200']['content']['application/json']
> => {
  const params = new URLSearchParams();
  if (limit) params.set('limit', limit.toString());
  if (search) params.set('search', search);
  if (showHidden) params.set('showHidden', 'true');
  if (nextToken) params.set('nextToken', nextToken);
  if (assessmentVersion != null)
    params.set('version', assessmentVersion.toString());

  return apiClient.get(
    `/assessments/${assessmentId}/pillars/${pillarId}/questions/${questionId}/best-practices/${bestPracticeId}?${params.toString()}`,
  );
};
