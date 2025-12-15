import { type paths } from '@shared/api-schema';

import { apiClient } from './client';

export async function getAssessmentStep(assessmentId: string): Promise<string> {
  const response = await apiClient.get<
    paths['/assessments/{assessmentId}/step']['get']['responses'][200]['content']['application/json']
  >(`/assessments/${assessmentId}/step`);
  return response.step;
}
