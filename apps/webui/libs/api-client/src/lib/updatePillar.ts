import { apiClient } from './client';
import { paths } from '@shared/api-schema';

export const updatePillar = async ({
  assessmentId,
  pillarId,
  disabled,
}: {
  assessmentId: string;
  pillarId: string;
  disabled?: boolean;
}) => {
  return apiClient.put<
    paths['/assessments/{assessmentId}/pillars/{pillarId}']['put']['responses']['200']['content']
  >(`/assessments/${assessmentId}/pillars/${pillarId}`, {
    disabled,
  });
};
