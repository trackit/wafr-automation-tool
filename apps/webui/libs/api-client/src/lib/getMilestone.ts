import { paths } from '@shared/api-schema';
import { apiClient } from './client';

export function getMilestone({
  assessmentId,
  milestoneId,
}: paths['/assessments/{assessmentId}/milestones/{milestoneId}']['get']['parameters']['path']) {
  return apiClient.get<
    paths['/assessments/{assessmentId}/milestones/{milestoneId}']['get']['responses']['200']['content']['application/json']
  >(`/assessments/${assessmentId}/milestones/${milestoneId}`);
}

export default getMilestone;
