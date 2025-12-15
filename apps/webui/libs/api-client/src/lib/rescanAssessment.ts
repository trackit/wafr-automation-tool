import { type paths } from '@shared/api-schema';

import { apiClient } from './client';

export function rescanAssessment({
  assessmentId,
}: paths['/assessments/{assessmentId}']['post']['parameters']['path']) {
  return apiClient.post(`/assessments/${assessmentId}`, {});
}

export default rescanAssessment;
