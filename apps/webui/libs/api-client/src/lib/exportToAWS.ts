import { type operations } from '@shared/api-schema';

import { apiClient } from './client';

export function exportToAWS(
  {
    assessmentId,
  }: operations['exportWellArchitectedTool']['parameters']['path'],
  requestBody: NonNullable<
    operations['exportWellArchitectedTool']['requestBody']
  >['content']['application/json'],
): Promise<
  operations['exportWellArchitectedTool']['responses']['200']['content']
> {
  return apiClient.post(
    `/assessments/${assessmentId}/exports/well-architected-tool`,
    requestBody,
  );
}

export default exportToAWS;
