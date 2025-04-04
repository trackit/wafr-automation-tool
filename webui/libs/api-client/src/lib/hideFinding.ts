import { paths } from '@webui/types';
import { apiClient } from './client';

export const hideFinding = async (
  assessmentId: string,
  findingId: string,
  hide: boolean
) => {
  return apiClient.put<
    paths['/assessments/{assessmentId}/findings/{findingId}/{hide}']['put']['responses']['200']['content']
  >(`/assessments/${assessmentId}/findings/${findingId}/${hide}`, {});
};

export default hideFinding;
