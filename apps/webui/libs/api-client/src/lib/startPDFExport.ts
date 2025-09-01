import { operations } from '@shared/api-schema';

import { apiClient } from './client';

export function startPDFExport(
  { assessmentId }: operations['startPDFExport']['parameters']['path'],
  body: operations['startPDFExport']['requestBody']['content']['application/json']
) {
  return apiClient.post(`/assessments/${assessmentId}/exports/pdf`, body);
}

export default startPDFExport;
