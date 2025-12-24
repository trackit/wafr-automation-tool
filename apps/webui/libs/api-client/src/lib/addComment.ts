import { type operations } from '@shared/api-schema';

import { apiClient } from './client';

export const addComment = async ({
  assessmentId,
  assessmentVersion,
  findingId,
  text,
}: {
  assessmentId: string;
  assessmentVersion: number;
  findingId: string;
  text: string;
}) => {
  const encodedFindingId = encodeURIComponent(findingId);

  return apiClient.post<
    operations['addComment']['responses']['200']['content']['application/json']
  >(
    `/assessments/${assessmentId}/versions/${assessmentVersion}/findings/${encodedFindingId}/comments`,
    {
      text,
    },
  );
};

export default addComment;
