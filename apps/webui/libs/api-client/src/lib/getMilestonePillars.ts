import { paths } from '@shared/api-schema';
import { apiClient } from './client';

export function getMilestonePillars({
  assessmentId,
  milestoneId,
}: paths['/assessments/{assessmentId}/milestones/{milestoneId}/pillars']['get']['parameters']['path']): Promise<
  paths['/assessments/{assessmentId}/milestones/{milestoneId}/pillars']['get']['responses']['200']['content']['application/json']
> {
  return apiClient.get(`/assessments/${assessmentId}/milestones/${milestoneId}/pillars`);
}

export default getMilestonePillars;
