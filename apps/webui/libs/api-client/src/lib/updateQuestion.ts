import { apiClient } from './client';
import { paths } from '@webui/types';

export const updateQuestion = async ({
  assessmentId,
  pillarId,
  questionId,
  none,
  disabled,
}: {
  assessmentId: string;
  pillarId: string;
  questionId: string;
  none?: boolean;
  disabled?: boolean;
}) => {
  return apiClient.put<
    paths['/assessments/{assessmentId}/pillars/{pillarId}/questions/{questionId}']['put']['responses']['200']['content']
  >(
    `/assessments/${assessmentId}/pillars/${pillarId}/questions/${questionId}`,
    {
      none,
      disabled,
    }
  );
};
