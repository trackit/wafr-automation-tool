import { Organization } from '@backend/models';
import { OrganizationRepository } from '@backend/ports';
import { createInjectionToken } from '@shared/di-container';

export class FakeOrganizationRepositoryDynamoDB
  implements OrganizationRepository
{
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
  createInjectionToken<FakeOrganizationRepositoryDynamoDB>(
    'FakeOrganizationRepository',
    { useClass: FakeOrganizationRepositoryDynamoDB }
  );
