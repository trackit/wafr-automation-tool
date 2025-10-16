import {
  Tenant,
  tokenLogger,
  tokenTypeORMClientManager,
} from '@backend/infrastructure';
import { inject } from '@shared/di-container';

export class MigrationRunnerAdapter {
  private readonly clientManager = inject(tokenTypeORMClientManager);
  private readonly logger = inject(tokenLogger);

  public async handle(): Promise<void> {
    await this.clientManager.initialize();
    const mainDataSource = await this.clientManager.getClient();
    await mainDataSource.runMigrations();

    const tenantRepo = mainDataSource.getRepository(Tenant);
    const tenants = await tenantRepo.find();

    this.logger.info(`Migrating ${tenants.length} tenants`);
    for (const tenant of tenants) {
      this.logger.info(
        `\n➡️  Migrating tenant ${tenant.id} (${tenant.databaseName})`,
      );
      const tenantDataSource = await this.clientManager.getClient(tenant.id);
      const results = await tenantDataSource.runMigrations().catch((error) => {
        this.logger.error(`❌ Tenant ${tenant.id} migration failed:`, error);
        return null;
      });
      if (results) {
        this.logger.info(
          `✅ Tenant ${tenant.id}: applied ${results.length} migrations`,
        );
      }
    }

    await this.clientManager.closeConnections();
  }
}
