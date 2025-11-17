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
    let retries = 0;
    while (retries < this.MAX_REFRESH_RETRIES) {
      try {
        const baseConfig = await this.baseConfigCreator();
        this.baseConfig = baseConfig;

        this.clients.default = new DataSource({
          ...baseConfig,
          ...tenantsTypeORMConfig,
        });

        await this.clients.default.initialize();
        this.isInitialized = true;
        return;
      } catch (err: any) {
        if (this.isAuthError(err) && retries < this.MAX_REFRESH_RETRIES - 1) {
          retries++;

          this.logger.warn(
            `[DB] Initialize failed (attempt ${retries + 1}/${this.MAX_REFRESH_RETRIES}), refreshing credentials...`,
          );

          await this.refreshCredentials();

          this.clients.default = new DataSource({
            ...this.baseConfig!,
            ...tenantsTypeORMConfig,
          });
          try {
            await this.clients.default.initialize();
            this.isInitialized = true;
            this.logger.info(
              `[DB] initialize succeeded after refresh (attempt ${retries})`,
            );
            return;
          } catch (innerErr: any) {
            this.logger.warn(
              `[DB] retry initialize attempt ${retries} failed: ${innerErr?.message}`,
            );
          }
        } else {
          this.logger.error(
            `[DB] Initialize failed after ${retries + 1} attempts`,
          );

          throw err;
        }
      }
    }
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
    if (!this.clients[id]) {
      this.clients[id] = new DataSource({
        ...this.baseConfig,
        database: this.toDatabaseName(id),
      });
    }
    let retries = 0;
    while (retries < this.MAX_REFRESH_RETRIES) {
      try {
        if (!this.clients[id].isInitialized) {
          await this.clients[id].initialize();
        }
        return this.clients[id];
      } catch (err: any) {
        if (this.isAuthError(err) && retries < this.MAX_REFRESH_RETRIES - 1) {
          retries++;
          await this.refreshCredentials();
          this.clients[id] = new DataSource({
            ...this.baseConfig!,
            database: this.toDatabaseName(id),
          });
          try {
            await this.clients[id].initialize();
            this.logger.info(
              `[DB] client ${id} initialized after refresh (attempt ${retries})`,
            );
            return this.clients[id];
          } catch (innerErr: any) {
            this.logger.warn(
              `[DB] retry client.init(${id}) attempt ${retries} failed: ${innerErr?.message}`,
            );
          }
        } else {
          this.logger.error(
            `[DB] Client init failed for ${id} after ${retries + 1} attempts`,
          );
          throw err;
        }
      }
    }

    throw new Error(
      `Failed to init client ${id} after ${this.MAX_REFRESH_RETRIES} attempts`,
    );
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

  private isAuthError(err: any): boolean {
    if (!err) return false;
    const msg = String(err.message || '').toLowerCase();
    return (
      err.code === '28P01' ||
      msg.includes('password') ||
      msg.includes('authentication failed')
    );
  }
}

export const tokenTypeORMClientManager =
  createInjectionToken<TypeORMClientManager>('TypeORMClientManager', {
    useClass: MultiDatabaseTypeORMClientManager,
  });
