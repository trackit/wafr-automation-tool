import {
  Tenant,
  tokenLogger,
  tokenTypeORMClientManager,
} from '@backend/infrastructure';
import { createInjectionToken, inject } from '@shared/di-container';

export interface RunDatabaseMigrationsUseCase {
  runDatabaseMigrations(): Promise<void>;
}

export class RunDatabaseMigrationsUseCaseImpl
  implements RunDatabaseMigrationsUseCase
{
  private readonly clientManager = inject(tokenTypeORMClientManager);
  private readonly logger = inject(tokenLogger);

  public async runDatabaseMigrations(): Promise<void> {
    await this.clientManager.initialize();
    const mainDataSource = await this.clientManager.getClient();
    await mainDataSource.runMigrations();

    const tenantRepo = mainDataSource.getRepository(Tenant);
    const tenants = await tenantRepo.find();

    this.logger.log(`Migrating ${tenants.length} tenants`);
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

export const tokenRunDatabaseMigrationsUseCase =
  createInjectionToken<RunDatabaseMigrationsUseCase>(
    'RunDatabaseMigrationsUseCase',
    {
      useClass: RunDatabaseMigrationsUseCaseImpl,
    }
  );
