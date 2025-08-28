import { paths } from '@shared/api-schema';
import { apiClient } from './client';

export function generatePDFExportURL({
  assessmentId,
  fileExportId,
}: paths['/assessments/{assessmentId}/exports/pdf/{fileExportId}/url']['get']['parameters']['path']): Promise<
  paths['/assessments/{assessmentId}/exports/pdf/{fileExportId}/url']['get']['responses']['200']['content']['application/json']
> {
  return apiClient.get<
    paths['/assessments/{assessmentId}/exports/pdf/{fileExportId}/url']['get']['responses']['200']['content']['application/json']
  >(`/assessments/${assessmentId}/exports/pdf/${fileExportId}/url`);
}

export default generatePDFExportURL;
