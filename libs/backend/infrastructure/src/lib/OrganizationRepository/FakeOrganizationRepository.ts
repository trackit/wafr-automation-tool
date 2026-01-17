import { type Organization } from '@backend/models';
import { type OrganizationRepository } from '@backend/ports';
import { createInjectionToken } from '@shared/di-container';

export class FakeOrganizationRepository implements OrganizationRepository {
  public organizations: Record<string, Organization> = {};

  async save(organization: Organization): Promise<void> {
    this.organizations[organization.domain] = organization;
  }

  async get(organizationDomain: string): Promise<Organization | undefined> {
    return this.organizations[organizationDomain];
  }

  async getAll(args?: {
    limit?: number;
    offset?: number;
  }): Promise<Organization[]> {
    const { limit, offset = 0 } = args || {};
    const organizations = Object.values(this.organizations);
    return organizations.slice(offset, limit ? offset + limit : undefined);
  }

  async update(args: {
    organizationDomain: string;
    organizationBody: Partial<Pick<Organization, 'folders'>>;
  }): Promise<void> {
    const { organizationDomain, organizationBody } = args;
    const organization = this.organizations[organizationDomain];
    if (organization) {
      Object.assign(organization, organizationBody);
    }
  }
}

export const tokenFakeOrganizationRepository =
  createInjectionToken<FakeOrganizationRepository>(
    'FakeOrganizationRepository',
    { useClass: FakeOrganizationRepository },
  );
