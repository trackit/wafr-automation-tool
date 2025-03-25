import { apiClient } from './client';
import { paths } from '@webui/types';

export const getAssessments = async () => {
  return apiClient.get<
    paths['/assessments']['get']['responses']['200']['content']['application/json']
  >(`/assessments`);
};
