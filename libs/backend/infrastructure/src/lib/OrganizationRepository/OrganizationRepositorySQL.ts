import { Repository } from 'typeorm';

import { Organization } from '@backend/models';
import { OrganizationRepository } from '@backend/ports';
import { createInjectionToken, inject } from '@shared/di-container';

import { OrganizationEntity } from '../config/typeorm';
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

  public async save(args: { organization: Organization }): Promise<void> {
    const { organization } = args;
    const repo = await this.repo();
    const entity = repo.create(organization);
    try {
      await repo.save(entity);
      this.logger.info(`Organization saved: ${organization.domain}`);
    } catch (error) {
      this.logger.error(`Failed to save organization: ${error}`, organization);
      throw error;
    }
  }

  public async get(args: {
    organizationDomain: string;
  }): Promise<Organization | undefined> {
    const { organizationDomain } = args;
    const repo = await this.repo();
    const entity = await repo.findOne({
      where: { domain: organizationDomain },
    });
    return entity ?? undefined;
  }
}

export const tokenOrganizationRepository =
  createInjectionToken<OrganizationRepository>('OrganizationRepository', {
    useClass: OrganizationRepositorySQL,
  });
