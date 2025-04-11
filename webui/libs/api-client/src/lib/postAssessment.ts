import { paths } from '@webui/types';
import { apiClient } from './client';

export function postAssessment({
  name,
  roleArn,
  regions,
  workflow,
}: paths['/assessments']['post']['parameters']['query']) {
  return apiClient.post('/assessments', {
    name,
    roleArn,
    regions,
    workflow,
  });
}

export default postAssessment;
