import { type components, type operations } from '@shared/api-schema';

import { apiClient } from './client';

export const updateFinding = async ({
  assessmentId,
  findingId,
  findingDto,
}: {
  assessmentId: string;
  findingId: string;
  findingDto: components['schemas']['FindingDto'];
}): Promise<operations['updateFinding']['responses']['200']['content']> => {
  const encodedFindingId = encodeURIComponent(findingId);

  return apiClient.put(
    `/assessments/${assessmentId}/findings/${encodedFindingId}`,
    findingDto,
  );
};

export default updateFinding;
