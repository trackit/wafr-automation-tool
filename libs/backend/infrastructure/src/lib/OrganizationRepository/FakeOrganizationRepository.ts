import { Organization } from '@backend/models';
import { OrganizationRepository } from '@backend/ports';
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
}

export const tokenFakeOrganizationRepository =
  createInjectionToken<FakeOrganizationRepository>(
    'FakeOrganizationRepository',
    { useClass: FakeOrganizationRepository },
  );
