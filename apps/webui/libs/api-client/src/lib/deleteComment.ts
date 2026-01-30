import { apiClient } from './client';

export const deleteComment = async ({
  assessmentId,
  findingId,
  commentId,
}: {
  assessmentId: string;
  findingId: string;
  commentId: string;
}): Promise<void> => {
  const encodedFindingId = encodeURIComponent(findingId);

  return apiClient.delete(
    `/assessments/${assessmentId}/findings/${encodedFindingId}/comments/${commentId}`,
  );
};

export default deleteComment;
