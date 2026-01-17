import { type paths } from '@shared/api-schema';

import { apiClient } from './client';

export function createFolder({
  name,
}: paths['/organization/folders']['post']['requestBody']['content']['application/json']) {
  return apiClient.post('/organization/folders', { name });
}

export default createFolder;
