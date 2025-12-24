import { type operations } from '@shared/api-schema';

import { apiClient } from './client';

export const deleteComment = async ({
  assessmentId,
  assessmentVersion,
  findingId,
  commentId,
}: {
  assessmentId: string;
  assessmentVersion: number;
  findingId: string;
  commentId: string;
}) => {
  const encodedFindingId = encodeURIComponent(findingId);

  return apiClient.delete<
    operations['deleteComment']['responses']['200']['content']
  >(
    `/assessments/${assessmentId}/versions/${assessmentVersion}/findings/${encodedFindingId}/comments/${commentId}`,
  );
};

export default deleteComment;
