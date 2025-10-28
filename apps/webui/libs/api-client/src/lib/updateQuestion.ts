import { paths } from '@shared/api-schema';

import { apiClient } from './client';

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
    },
  );
};
