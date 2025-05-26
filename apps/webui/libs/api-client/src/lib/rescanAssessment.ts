import { apiClient } from './client';
import { paths } from '@shared/api-schema';

export function rescanAssessment({
  assessmentId,
}: paths['/assessments/{assessmentId}']['post']['parameters']['path']) {
  return apiClient.post(`/assessments/${assessmentId}`, {});
}

export default rescanAssessment;
