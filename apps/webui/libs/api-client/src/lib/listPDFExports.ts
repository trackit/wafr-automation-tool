import { paths } from '@shared/api-schema';
import { apiClient } from './client';

export function listPDFExports({
  assessmentId,
}: paths['/assessments/{assessmentId}/exports/pdf']['get']['parameters']['path']): Promise<
  paths['/assessments/{assessmentId}/exports/pdf']['get']['responses']['200']['content']['application/json']
> {
  return apiClient.get<
    paths['/assessments/{assessmentId}/exports/pdf']['get']['responses']['200']['content']['application/json']
  >(`/assessments/${assessmentId}/exports/pdf`);
}

export default listPDFExports;
