import { Repository } from 'typeorm';

import { Organization } from '@backend/models';
import { OrganizationRepository } from '@backend/ports';
import { inject } from '@shared/di-container';

import { OrganizationEntity } from '../config/typeorm';
import { tokenLogger } from '../Logger';
import { tokenTypeORMClientManager } from '../TypeORMClientManager';
import { toDomainOrganization } from './OrganizationsRepositoryMappingSQL';

const ORGANIZATIONS_GET_ALL_LIMIT = 100;

export class OrganizationRepositorySQL implements OrganizationRepository {
  private readonly clientManager = inject(tokenTypeORMClientManager);
  private readonly logger = inject(tokenLogger);

  private async repo(): Promise<Repository<OrganizationEntity>> {
    if (!this.clientManager.isInitialized) {
      await this.clientManager.initialize();
    }
    const dataSource = await this.clientManager.getClient();
    return dataSource.getRepository(OrganizationEntity);
  }

  public async save(organization: Organization): Promise<void> {
    const repo = await this.repo();

    const entity = repo.create(organization);

    await Promise.all([
      repo.save(entity),
      this.clientManager.createClient(organization.domain),
    ]);
    this.logger.info(`Organization saved: ${organization.domain}`);
  }

  public async get(
    organizationDomain: string,
  ): Promise<Organization | undefined> {
    const repo = await this.repo();

    const entity = await repo.findOne({
      where: { domain: organizationDomain },
      relations: {
        aceIntegration: {
          opportunityTeamMembers: true,
        },
      },
    });

    if (!entity) return undefined;
    return toDomainOrganization(entity);
  }

  public async getAll(): Promise<Organization[]> {
    const repo = await this.repo();
    const entities = await repo.find({
      take: ORGANIZATIONS_GET_ALL_LIMIT,
    });
    return entities.map(toDomainOrganization);
  }
}
