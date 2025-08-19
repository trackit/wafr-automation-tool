import { paths } from '@shared/api-schema';
import { apiClient } from './client';

export function getMilestones({
  assessmentId,
}: paths['/assessments/{assessmentId}/milestones']['get']['parameters']['path']): Promise<
  paths['/assessments/{assessmentId}/milestones']['get']['responses']['200']['content']['application/json']
> {
  return apiClient.get(`/assessments/${assessmentId}/milestones`);
}

export default getMilestones;
