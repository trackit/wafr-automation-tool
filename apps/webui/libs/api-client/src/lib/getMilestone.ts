import { type operations } from '@shared/api-schema';

import { apiClient } from './client';

export function getMilestone({
  assessmentId,
  milestoneId,
}: operations['getMilestone']['parameters']['path']): Promise<
  operations['getMilestone']['responses']['200']['content']['application/json']
> {
  return apiClient.get(
    `/assessments/${assessmentId}/milestones/${milestoneId}`,
  );
}

export default getMilestone;
