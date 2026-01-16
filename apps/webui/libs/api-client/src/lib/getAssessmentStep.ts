import { type operations } from '@shared/api-schema';

import { apiClient } from './client';

export async function getAssessmentStep(assessmentId: string): Promise<string> {
  const response = await apiClient.get<
    operations['getAssessmentStep']['responses'][200]['content']['application/json']
  >(`/assessments/${assessmentId}/step`);
  return response.step;
}
