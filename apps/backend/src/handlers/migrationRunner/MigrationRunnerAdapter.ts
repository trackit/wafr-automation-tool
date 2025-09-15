import {
  Tenant,
  tokenLogger,
  tokenTypeORMClientManager,
} from '@backend/infrastructure';
import { inject } from '@shared/di-container';

export class MigrationRunnerAdapter {
  private clientManager = inject(tokenTypeORMClientManager);
  private logger = inject(tokenLogger);

  public async handle(): Promise<void> {
    const mainDataSource = await this.clientManager.initializeDefaultDatabase();

    const tenantRepo = mainDataSource.getRepository(Tenant);
    const tenants = await tenantRepo.find();

    this.logger.log(`Found ${tenants.length} tenants`);
    for (const tenant of tenants) {
      this.logger.log(
        `\n➡️  Migrating tenant ${tenant.id} (${tenant.databaseName})`
      );
      const tenantDataSource = await this.clientManager.getClient(tenant.id);
      const results = await tenantDataSource.runMigrations().catch((error) => {
        this.logger.error(`❌ Tenant ${tenant.id} migration failed:`, error);
        return null;
      });
      if (results) {
        this.logger.log(
          `✅ Tenant ${tenant.id}: applied ${results.length} migrations`
        );
      }
    }

    await this.clientManager.closeConnections();
  }
}
