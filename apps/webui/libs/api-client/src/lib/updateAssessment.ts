import { type paths } from '@shared/api-schema';

import { apiClient } from './client';

export function updateAssessment({
  assessmentId,
  ...body
}: paths['/assessments/{assessmentId}']['put']['parameters']['path'] &
  paths['/assessments/{assessmentId}']['put']['requestBody']['content']['application/json']) {
  return apiClient.put(`/assessments/${assessmentId}`, body);
}

export default updateAssessment;
