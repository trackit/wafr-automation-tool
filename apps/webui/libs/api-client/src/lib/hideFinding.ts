import { paths } from '@shared/api-schema';
import { apiClient } from './client';

export const hideFinding = async ({
  assessmentId,
  pillarId,
  questionId,
  bestPracticeId,
  findingId,
  hide,
}: {
  assessmentId: string;
  pillarId: string;
  questionId: string;
  bestPracticeId: string;
  findingId: string;
  hide: boolean;
}) => {
  const encodedFindingId = encodeURIComponent(findingId);

  return apiClient.put<
    paths['/assessments/{assessmentId}/pillars/{pillarId}/questions/{questionId}/best-practices/{bestPracticeId}/findings/{findingId}']['put']['responses']['200']['content']
  >(
    `/assessments/${assessmentId}/pillars/${pillarId}/questions/${questionId}/best-practices/${bestPracticeId}/findings/${encodedFindingId}`,
    {
      hidden: hide,
    }
  );
};

export default hideFinding;
