import { type components, type operations } from '@shared/api-schema';

import { apiClient } from './client';

export async function getAssessmentGraph(
  assessmentId: string,
): Promise<components['schemas']['AssessmentGraph']> {
  const response = await apiClient.get<
    operations['getAssessmentGraph']['responses'][200]['content']['application/json']
  >(`/assessments/${assessmentId}/graph`);
  return response;
}
