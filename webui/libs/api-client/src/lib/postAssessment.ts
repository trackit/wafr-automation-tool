import { paths } from '@webui/types';
import { apiClient } from './client';

export function postAssessment({
  name,
  roleArn,
  regions,
  workflows,
}: paths['/assessments']['post']['requestBody']['content']['application/json']) {
  return apiClient.post('/assessments', {
    name,
    roleArn,
    regions,
    workflows,
  });
}

export default postAssessment;
