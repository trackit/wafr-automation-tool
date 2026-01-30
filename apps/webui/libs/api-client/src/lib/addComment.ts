import { type operations } from '@shared/api-schema';

import { apiClient } from './client';

export const addComment = async ({
  assessmentId,
  findingId,
  text,
}: {
  assessmentId: string;
  findingId: string;
  text: string;
}): Promise<
  operations['addComment']['responses']['200']['content']['application/json']
> => {
  const encodedFindingId = encodeURIComponent(findingId);

  return apiClient.post(
    `/assessments/${assessmentId}/findings/${encodedFindingId}/comments`,
    {
      text,
    },
  );
};

export default addComment;
