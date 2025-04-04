import { apiClient } from './client';
import { paths } from '@webui/types';

export function deleteAssessment({
  assessmentId,
}: paths['/assessments/{assessmentId}']['delete']['parameters']['path']) {
  return apiClient.delete(`/assessments/${assessmentId}`);
}

export default deleteAssessment;
