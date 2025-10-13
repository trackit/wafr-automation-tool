import { Organization } from '@backend/models';
import { OrganizationRepository } from '@backend/ports';
import { createInjectionToken } from '@shared/di-container';

export class FakeOrganizationRepositoryDynamoDB
  implements OrganizationRepository
{
  public organizations: Record<string, Organization> = {};

  async save(organization: Organization): Promise<void> {
    this.organizations[organization.domain] = organization;
  }

  async get(organizationDomain: string): Promise<Organization | undefined> {
    return this.organizations[organizationDomain];
  }
}

export const tokenFakeOrganizationRepository =
  createInjectionToken<FakeOrganizationRepositoryDynamoDB>(
    'FakeOrganizationRepository',
    { useClass: FakeOrganizationRepositoryDynamoDB },
  );
