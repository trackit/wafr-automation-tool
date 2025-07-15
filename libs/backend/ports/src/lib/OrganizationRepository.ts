import { Organization } from '@backend/models';

export interface OrganizationRepository {
  save(args: { organization: Organization }): Promise<void>;
  get(args: { organizationDomain: string }): Promise<Organization | undefined>;
}
