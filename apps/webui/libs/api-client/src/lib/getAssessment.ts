import { type operations } from '@shared/api-schema';

import { apiClient } from './client';

export const getAssessment = async (
  assessmentId: string,
  version: string | undefined = undefined,
): Promise<
  operations['getAssessment']['responses']['200']['content']['application/json']
> => {
  const params = new URLSearchParams();
  if (version != null) params.set('version', version.toString());
  return apiClient.get(`/assessments/${assessmentId}?${params.toString()}`);
};
