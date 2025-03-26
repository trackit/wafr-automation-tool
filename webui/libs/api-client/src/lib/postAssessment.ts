import { apiClient } from './client';
import { paths } from '@webui/types';

export function postAssessment({
  name,
  roleArn,
}: paths['/assessments']['post']['parameters']['query']) {
  return apiClient.post('/assessments', {
    name,
    roleArn,
  });
}

export default postAssessment;
