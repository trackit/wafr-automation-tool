import { type paths } from '@shared/api-schema';

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
}): Promise<
  paths['/assessments/{assessmentId}/pillars/{pillarId}/questions/{questionId}']['put']['responses']['200']['content']
> => {
  return apiClient.put(
    `/assessments/${assessmentId}/pillars/${pillarId}/questions/${questionId}`,
    {
      none,
      disabled,
    },
  );
};
