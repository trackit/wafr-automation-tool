import { type Organization } from '@backend/models';

export interface OrganizationRepository {
  save(organization: Organization): Promise<void>;
  get(organizationDomain: string): Promise<Organization | undefined>;
  getAll(args?: { limit?: number; offset?: number }): Promise<Organization[]>;
  update(args: {
    organizationDomain: string;
    organizationBody: Partial<Pick<Organization, 'folders'>>;
  }): Promise<void>;
}
