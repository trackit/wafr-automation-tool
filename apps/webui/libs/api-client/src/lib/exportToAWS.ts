import { paths } from '@shared/api-schema';
import { apiClient } from './client';

export function exportToAWS({
  assessmentId,
}: paths['/assessments/{assessmentId}/exports/well-architected-tool']['post']['parameters']['path']) {
  return apiClient.post(
    `/assessments/${assessmentId}/exports/well-architected-tool`,
    {}
  );
}

export default exportToAWS;
