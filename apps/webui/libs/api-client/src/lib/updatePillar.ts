import { type operations } from '@shared/api-schema';

import { apiClient } from './client';

export const updatePillar = async ({
  assessmentId,
  pillarId,
  disabled,
}: {
  assessmentId: string;
  pillarId: string;
  disabled?: boolean;
}): Promise<operations['updatePillar']['responses']['200']['content']> => {
  return apiClient.put(`/assessments/${assessmentId}/pillars/${pillarId}`, {
    disabled,
  });
};
