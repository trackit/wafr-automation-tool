import { type components, type operations } from '@shared/api-schema';

import { apiClient } from './client';

export async function getAssessmentGraph(
  assessmentId: string,
  version: string | undefined = undefined,
): Promise<components['schemas']['AssessmentGraph']> {
  const params = new URLSearchParams();
  if (version != null) params.set('version', version.toString());
  return apiClient.get<
    operations['getAssessmentGraph']['responses'][200]['content']['application/json']
  >(`/assessments/${assessmentId}/graph?${params.toString()}`);
}
