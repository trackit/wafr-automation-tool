import { paths } from '@shared/api-schema';

import { apiClient } from './client';

export function deleteAssessment({
  assessmentId,
}: paths['/assessments/{assessmentId}']['delete']['parameters']['path']) {
  return apiClient.delete(`/assessments/${assessmentId}`);
}

export default deleteAssessment;
