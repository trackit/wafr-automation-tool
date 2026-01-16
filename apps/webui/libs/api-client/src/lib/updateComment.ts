import { type components, type operations } from '@shared/api-schema';

import { apiClient } from './client';

export const updateComment = async ({
  assessmentId,
  findingId,
  commentId,
  commentDto,
}: {
  assessmentId: string;
  findingId: string;
  commentId: string;
  commentDto: components['schemas']['CommentDto'];
}): Promise<operations['updateComment']['responses']['200']['content']> => {
  const encodedFindingId = encodeURIComponent(findingId);

  return apiClient.put(
    `/assessments/${assessmentId}/findings/${encodedFindingId}/comments/${commentId}`,
    commentDto,
  );
};

export default updateComment;
