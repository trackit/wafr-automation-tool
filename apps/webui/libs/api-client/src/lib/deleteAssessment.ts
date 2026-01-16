import { type paths } from '@shared/api-schema';

import { apiClient } from './client';

export function deleteAssessment({
  assessmentId,
}: paths['/assessments/{assessmentId}']['delete']['parameters']['path']): Promise<void> {
  return apiClient.delete(`/assessments/${assessmentId}`);
}

export default deleteAssessment;
