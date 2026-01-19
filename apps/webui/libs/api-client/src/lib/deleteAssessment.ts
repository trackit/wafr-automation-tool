import { type operations } from '@shared/api-schema';

import { apiClient } from './client';

export function deleteAssessment({
  assessmentId,
}: operations['deleteAssessment']['parameters']['path']): Promise<void> {
  return apiClient.delete(`/assessments/${assessmentId}`);
}

export default deleteAssessment;
