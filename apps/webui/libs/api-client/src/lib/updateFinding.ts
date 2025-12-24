import { type components, type operations } from '@shared/api-schema';

import { apiClient } from './client';

export const updateFinding = async ({
  assessmentId,
  findingId,
  assessmentVersion,
  findingDto,
}: {
  assessmentId: string;
  assessmentVersion: number;
  findingId: string;
  findingDto: components['schemas']['FindingDto'];
}) => {
  const encodedFindingId = encodeURIComponent(findingId);

  return apiClient.put<
    operations['updateFinding']['responses']['200']['content']
  >(
    `/assessments/${assessmentId}/versions/${assessmentVersion}/findings/${encodedFindingId}`,
    findingDto,
  );
};

export default updateFinding;
