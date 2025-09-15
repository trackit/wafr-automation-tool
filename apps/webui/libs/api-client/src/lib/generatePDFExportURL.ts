import { operations } from '@shared/api-schema';

import { apiClient } from './client';

export function generatePDFExportURL({
  assessmentId,
  fileExportId,
}: operations['generatePDFExportURL']['parameters']['path']): Promise<
  operations['generatePDFExportURL']['responses']['200']['content']['application/json']
> {
  return apiClient.get<
    operations['generatePDFExportURL']['responses']['200']['content']['application/json']
  >(`/assessments/${assessmentId}/exports/pdf/${fileExportId}/url`);
}

export default generatePDFExportURL;
