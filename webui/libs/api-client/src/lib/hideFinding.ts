import { paths } from '@webui/types';
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
  return apiClient.put<
    paths['/assessments/{assessmentId}/pillars/{pillarId}/questions/{questionId}/best-practices/{bestPracticeId}/findings/{findingId}']['put']['responses']['200']['content']
  >(
    `/assessments/${assessmentId}/pillars/${pillarId}/questions/${questionId}/best-practices/${bestPracticeId}/findings/${findingId}`,
    {
      hidden: hide,
    }
  );
};

export default hideFinding;
