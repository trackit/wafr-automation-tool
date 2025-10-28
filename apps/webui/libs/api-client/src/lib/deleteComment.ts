import { operations } from '@shared/api-schema';

import { apiClient } from './client';

export const deleteComment = async ({
  assessmentId,
  findingId,
  commentId,
}: {
  assessmentId: string;
  findingId: string;
  commentId: string;
}) => {
  const encodedFindingId = encodeURIComponent(findingId);

  return apiClient.delete<
    operations['deleteComment']['responses']['200']['content']
  >(
    `/assessments/${assessmentId}/findings/${encodedFindingId}/comments/${commentId}`,
  );
};

export default deleteComment;
