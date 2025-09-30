import { Repository } from 'typeorm';

import { Organization } from '@backend/models';
import { OrganizationRepository } from '@backend/ports';
import { inject } from '@shared/di-container';

import { OrganizationEntity } from '../config/typeorm/tenantsEntities';
import { tokenLogger } from '../Logger';
import { tokenTypeORMClientManager } from '../TypeORMClientManager';

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

    await repo.save(entity);
    this.logger.info(`Organization saved: ${organization.domain}`);
  }

  public async get(
    organizationDomain: string
  ): Promise<Organization | undefined> {
    const repo = await this.repo();

    const entity = await repo.findOne({
      where: { domain: organizationDomain },
    });

    return entity ?? undefined;
  }
}
