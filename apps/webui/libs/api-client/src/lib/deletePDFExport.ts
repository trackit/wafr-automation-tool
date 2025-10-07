import { operations } from '@shared/api-schema';

import { apiClient } from './client';

export function deletePDFExport({
  assessmentId,
  fileExportId,
}: operations['deletePDFExport']['parameters']['path']): Promise<void> {
  return apiClient.delete(
    `/assessments/${assessmentId}/exports/pdf/${fileExportId}`,
  );
}

export default deletePDFExport;
