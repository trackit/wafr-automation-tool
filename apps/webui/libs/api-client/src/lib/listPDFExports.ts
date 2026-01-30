import { type operations } from '@shared/api-schema';

import { apiClient } from './client';

export function listPDFExports({
  assessmentId,
}: operations['listPDFExports']['parameters']['path']): Promise<
  operations['listPDFExports']['responses']['200']['content']['application/json']
> {
  return apiClient.get(`/assessments/${assessmentId}/exports/pdf`);
}

export default listPDFExports;
