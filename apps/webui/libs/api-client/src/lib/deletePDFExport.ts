import { paths } from '@shared/api-schema';
import { apiClient } from './client';

export function deletePDFExport({
  assessmentId,
  fileExportId,
}: paths['/assessments/{assessmentId}/exports/pdf/{fileExportId}']['delete']['parameters']['path']): Promise<void> {
  return apiClient.delete(
    `/assessments/${assessmentId}/exports/pdf/${fileExportId}`
  );
}

export default deletePDFExport;
