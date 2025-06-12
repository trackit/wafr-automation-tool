import { operations } from '@shared/api-schema';
import { apiClient } from './client';

export const hideFinding = async ({
  assessmentId,
  findingId,
  hide,
}: {
  assessmentId: string;
  findingId: string;
  hide: boolean;
}) => {
  const encodedFindingId = encodeURIComponent(findingId);

  return apiClient.put<
    operations['updateFinding']['responses']['200']['content']
  >(`/assessments/${assessmentId}/findings/${encodedFindingId}`, {
    hidden: hide,
  });
};

export default hideFinding;
