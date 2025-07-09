import { Organization } from '@backend/models';

export interface OrganizationRepository {
  get(args: { organizationDomain: string }): Promise<Organization | undefined>;
}
