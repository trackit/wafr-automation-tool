import { apiClient } from './client';
import { paths } from '@webui/types';

export const resolveQuestion = async ({
  assessmentId,
  pillarId,
  questionId,
  resolve,
}: {
  assessmentId: string;
  pillarId: string;
  questionId: string;
  resolve: boolean;
}) => {
  return apiClient.put<
    paths['/assessments/{assessmentId}/pillars/{pillarId}/questions/{questionId}/{resolve}']['put']['responses']['200']['content']
  >(
    `/assessments/${assessmentId}/pillars/${pillarId}/questions/${questionId}/${resolve}`,
    {}
  );
};
