import { operations } from '@shared/api-schema';

import { apiClient } from './client';

export const addComment = async ({
  assessmentId,
  findingId,
  text,
}: {
  assessmentId: string;
  findingId: string;
  text: string;
}) => {
  const encodedFindingId = encodeURIComponent(findingId);

  return apiClient.post<
    operations['addComment']['responses']['200']['content']['application/json']
  >(`/assessments/${assessmentId}/findings/${encodedFindingId}/comments`, {
    text,
  });
};

export default addComment;
