import { type operations } from '@shared/api-schema';

import { apiClient } from './client';

export function postAssessment({
  name,
  roleArn,
  regions,
  workflows,
}: operations['startAssessment']['requestBody']['content']['application/json']) {
  return apiClient.post('/assessments', {
    name,
    roleArn,
    regions,
    workflows,
  });
}

export default postAssessment;
