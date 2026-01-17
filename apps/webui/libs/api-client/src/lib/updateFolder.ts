import { type paths } from '@shared/api-schema';

import { apiClient } from './client';

export function updateFolder({
  folderName,
  name,
}: paths['/organization/folders/{folderName}']['put']['parameters']['path'] &
  paths['/organization/folders/{folderName}']['put']['requestBody']['content']['application/json']) {
  return apiClient.put(`/organization/folders/${encodeURIComponent(folderName)}`, { name });
}

export default updateFolder;
