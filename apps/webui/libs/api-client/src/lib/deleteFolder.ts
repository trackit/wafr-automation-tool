import { type paths } from '@shared/api-schema';

import { apiClient } from './client';

export function deleteFolder({
  folderName,
}: paths['/organization/folders/{folderName}']['delete']['parameters']['path']) {
  return apiClient.delete(
    `/organization/folders/${encodeURIComponent(folderName)}`,
  );
}

export default deleteFolder;
