import { apiClient } from './client';

export async function getAssessmentStep(assessmentId: string): Promise<string> {
  const response = await apiClient.get<{ step: string }>(`/assessments/${assessmentId}/step`);
  return response.step;
}
