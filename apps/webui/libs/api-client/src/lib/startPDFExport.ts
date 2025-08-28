import { paths } from '@shared/api-schema';
import { apiClient } from './client';

export function startPDFExport(
  {
    assessmentId,
  }: paths['/assessments/{assessmentId}/exports/pdf']['post']['parameters']['path'],
  versionName: string
) {
  return apiClient.post(`/assessments/${assessmentId}/exports/pdf`, {
    versionName,
  });
}

export default startPDFExport;
