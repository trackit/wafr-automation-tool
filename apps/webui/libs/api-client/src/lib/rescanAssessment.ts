import { type operations } from '@shared/api-schema';

import { apiClient } from './client';

export function rescanAssessment({
  assessmentId,
}: operations['rescanAssessment']['parameters']['path']) {
  return apiClient.post(`/assessments/${assessmentId}`, {});
}

export default rescanAssessment;
