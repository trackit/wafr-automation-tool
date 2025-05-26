import { apiClient } from './client';
import { paths } from '@shared/api-schema';

export function deleteAssessment({
  assessmentId,
}: paths['/assessments/{assessmentId}']['delete']['parameters']['path']) {
  return apiClient.delete(`/assessments/${assessmentId}`);
}

export default deleteAssessment;
