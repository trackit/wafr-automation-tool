import { DataSource } from 'typeorm';

import { type TypeORMClientManager } from '@backend/ports';
import { createInjectionToken, inject } from '@shared/di-container';

import {
  Tenant,
  tenantsTypeORMConfig,
  tokenTypeORMConfigCreator,
  type TypeORMConfig,
} from '../config/typeorm';
import { tokenLogger } from '../Logger';

interface DatabaseError {
  code?: string;
  message?: string;
}

export class MultiDatabaseTypeORMClientManager implements TypeORMClientManager {
  public clients: Record<string, DataSource> = {};
  private baseConfigCreator: () => Promise<TypeORMConfig> = inject(
    tokenTypeORMConfigCreator,
  );
  private baseConfig: TypeORMConfig | null = null;
  public isInitialized = false;
  private readonly logger = inject(tokenLogger);
  private readonly MAX_REFRESH_RETRIES = 5;

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    await this.withRetry(async () => {
      const baseConfig = await this.baseConfigCreator();
      this.baseConfig = baseConfig;

      await this.initializeDefaultDataSource({
        ...baseConfig,
        ...tenantsTypeORMConfig,
      });
      this.isInitialized = true;
    }, 'Initialize');
  }

  public toDatabaseName(identifier: string): string {
    return `database_${identifier.replace(/[^A-Za-z_0-9]/g, '_')}`;
  }

  public async getClient(id?: string): Promise<DataSource> {
    id = id ?? 'default';

    if (!this.isInitialized || !this.baseConfig) {
      throw new Error(
        'TypeORMClientManager not initialized. Call initialize() first.',
      );
    }
    if (id === 'default') {
      return this.clients.default;
    }

    const existingClient = await this.getExistingHealthyClient(id);
    if (existingClient) {
      return existingClient;
    }

    await this.withRetry(async () => {
      await this.initializeDataSource(id, {
        ...this.baseConfig!,
        database: this.toDatabaseName(id),
      });
    }, `getClient(${id})`);
    return this.clients[id];
  }

  public async clearClients(): Promise<void> {
    const clients = Object.values(this.clients);
    await Promise.all(
      clients.map(async (client) => {
        if (!client.isInitialized) await client.initialize();
        const entities = client.entityMetadatas;
        const tableNames = entities.map((entity) => `"${entity.tableName}"`);
        if (tableNames.length === 0) return;
        await client.query(`TRUNCATE TABLE ${tableNames.join(', ')} CASCADE;`);
      }),
    );
  }

  public async closeConnections(): Promise<void> {
    const clients = Object.values(this.clients);
    await Promise.all(
      clients.map(async (client) => {
        if (client.isInitialized) {
          await client.destroy();
        }
      }),
    );
  }

  private async createDatabase(id: string): Promise<void> {
    const databaseName = this.toDatabaseName(id);
    const defaultClient = await this.getClient();
    const databaseAlreadyExists = await defaultClient
      .getRepository(Tenant)
      .findOneBy({ id });
    if (!databaseAlreadyExists) {
      await defaultClient
        .query(`CREATE DATABASE "${databaseName}";`)
        .catch(() => null); // Ignore errors, database might already exist
      await defaultClient.getRepository(Tenant).save({ id, databaseName });
    }
  }

  public async createClient(id: string): Promise<DataSource> {
    if (this.clients[id]?.isInitialized) {
      return this.clients[id];
    }
    await this.createDatabase(id);
    const client = await this.getClient(id);
    if (client.migrations.length > 0) {
      await client.runMigrations();
    }
    return client;
  }

  public async refreshCredentials(): Promise<void> {
    this.baseConfig = await this.baseConfigCreator();
  }

  private isAuthError(err: unknown): boolean {
    if (!err || typeof err !== 'object') return false;

    const dbError = err as DatabaseError;
    const msg = String(dbError.message || '').toLowerCase();
    console.log('DB Error:', dbError);
    return (
      dbError.code === '28P01' || msg.includes('password authentication failed')
    );
  }

  private async withRetry(
    operation: () => Promise<void>,
    operationName: string,
  ): Promise<void> {
    let retries = 0;

    while (retries < this.MAX_REFRESH_RETRIES) {
      try {
        return await operation();
      } catch (err: unknown) {
        if (!this.isAuthError(err)) {
          this.logger.error(`[DB] ${operationName} failed with non-auth error`);
          throw err;
        }

        if (retries >= this.MAX_REFRESH_RETRIES - 1) {
          this.logger.error(
            `[DB] ${operationName} failed after ${retries + 1} auth attempts`,
          );
          throw err;
        }

        retries++;
        this.logger.warn(
          `[DB] ${operationName} failed (attempt ${retries}/${this.MAX_REFRESH_RETRIES}), refreshing credentials...`,
        );

        await this.refreshCredentials();
      }
    }

    throw new Error(
      `Failed ${operationName} after ${this.MAX_REFRESH_RETRIES} attempts`,
    );
  }

  private async initializeDataSource(
    id: string,
    config: TypeORMConfig,
  ): Promise<void> {
    if (this.clients[id]?.isInitialized) {
      await this.clients[id].destroy();
    }

    this.clients[id] = new DataSource(config);
    await this.clients[id].initialize();
  }

  public async getExistingHealthyClient(
    id: string,
  ): Promise<DataSource | null> {
    const existingClient = this.clients[id];

    if (!existingClient?.isInitialized) {
      return null;
    }

    try {
      await existingClient.query('SELECT 1');
      return existingClient;
    } catch (error) {
      this.logger.warn(
        `[DB] Existing client ${id} failed health check: ${error}`,
      );
      return null;
    }
  }

  private async initializeDefaultDataSource(
    config: TypeORMConfig,
  ): Promise<void> {
    this.clients.default = new DataSource(config);
    await this.clients.default.initialize();
  }
}

export const tokenTypeORMClientManager =
  createInjectionToken<TypeORMClientManager>('TypeORMClientManager', {
    useClass: MultiDatabaseTypeORMClientManager,
  });
