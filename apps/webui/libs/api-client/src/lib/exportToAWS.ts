import { paths } from '@shared/api-schema';

import { apiClient } from './client';

export function exportToAWS(
  {
    assessmentId,
  }: paths['/assessments/{assessmentId}/exports/well-architected-tool']['post']['parameters']['path'],
  requestBody: NonNullable<
    paths['/assessments/{assessmentId}/exports/well-architected-tool']['post']['requestBody']
  >['content']['application/json']
) {
  return apiClient.post(
    `/assessments/${assessmentId}/exports/well-architected-tool`,
    requestBody
  );
}

export default exportToAWS;
