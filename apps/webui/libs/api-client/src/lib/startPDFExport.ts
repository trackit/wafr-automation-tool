import { paths } from '@shared/api-schema';
import { apiClient } from './client';

export function startPDFExport(
  {
    assessmentId,
  }: paths['/assessments/{assessmentId}/exports/pdf']['post']['parameters']['path'],
  body: paths['/assessments/{assessmentId}/exports/pdf']['post']['requestBody']['content']['application/json']
) {
  return apiClient.post(`/assessments/${assessmentId}/exports/pdf`, body);
}

export default startPDFExport;
