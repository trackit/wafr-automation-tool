import { type paths } from '@shared/api-schema';

import { apiClient } from './client';

export const updatePillar = async ({
  assessmentId,
  pillarId,
  disabled,
}: {
  assessmentId: string;
  pillarId: string;
  disabled?: boolean;
}): Promise<
  paths['/assessments/{assessmentId}/pillars/{pillarId}']['put']['responses']['200']['content']
> => {
  return apiClient.put(`/assessments/${assessmentId}/pillars/${pillarId}`, {
    disabled,
  });
};
