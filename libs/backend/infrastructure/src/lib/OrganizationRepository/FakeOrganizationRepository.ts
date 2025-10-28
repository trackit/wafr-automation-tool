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
}

export const tokenFakeOrganizationRepository =
  createInjectionToken<FakeOrganizationRepository>(
    'FakeOrganizationRepository',
    { useClass: FakeOrganizationRepository },
  );
