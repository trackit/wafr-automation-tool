import { Organization } from '@backend/models';

export interface OrganizationRepository {
  save(organization: Organization): Promise<void>;
  get(organizationDomain: string): Promise<Organization | undefined>;
  getAll(): Promise<Organization[]>;
}
