import { type components, type operations } from '@shared/api-schema';

import { apiClient } from './client';

export const updateComment = async ({
  assessmentId,
  findingId,
  assessmentVersion,
  commentId,
  commentDto,
}: {
  assessmentId: string;
  findingId: string;
  assessmentVersion: number;
  commentId: string;
  commentDto: components['schemas']['CommentDto'];
}) => {
  const encodedFindingId = encodeURIComponent(findingId);

  return apiClient.put<
    operations['updateComment']['responses']['200']['content']
  >(
    `/assessments/${assessmentId}/versions/${assessmentVersion}/findings/${encodedFindingId}/comments/${commentId}`,
    commentDto,
  );
};

export default updateComment;
