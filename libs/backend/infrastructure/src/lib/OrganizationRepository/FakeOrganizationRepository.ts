import { Organization } from '@backend/models';
import { OrganizationRepository } from '@backend/ports';
import { createInjectionToken } from '@shared/di-container';

export class FakeOrganizationRepository implements OrganizationRepository {
  public organizations: Record<string, Organization> = {};

  async save(args: { organization: Organization }): Promise<void> {
    const { organization } = args;
    this.organizations[organization.domain] = organization;
  }

  async get(args: {
    organizationDomain: string;
  }): Promise<Organization | undefined> {
    return this.organizations[args.organizationDomain];
  }
}

export const tokenFakeOrganizationRepository =
  createInjectionToken<FakeOrganizationRepository>(
    'FakeOrganizationRepository',
    { useClass: FakeOrganizationRepository }
  );
