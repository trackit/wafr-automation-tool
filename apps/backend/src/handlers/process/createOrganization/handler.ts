import { Organization } from '@backend/models';

import { CreateOrganizationAdapter } from './CreateOrganizationAdapter';

const adapter = new CreateOrganizationAdapter();

export const main = async (event: Organization): Promise<void> =>
  adapter.handle(event);
