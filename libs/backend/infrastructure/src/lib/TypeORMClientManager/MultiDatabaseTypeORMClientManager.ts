import {
  Column,
  CreateDateColumn,
  DataSource,
  Entity,
  PrimaryColumn,
} from 'typeorm';

import { TypeORMClientManager } from '@backend/ports';
import { createInjectionToken, inject } from '@shared/di-container';

import { tokenTypeORMConfigCreator, TypeORMConfig } from '../config/typeorm';

@Entity('tenants')
export class Tenant {
  @PrimaryColumn('varchar')
  id!: string;

  @Column('varchar', { unique: true })
  databaseName!: string;

  @CreateDateColumn()
  createdAt!: Date;
}

class MultiDatabaseTypeORMClientManager implements TypeORMClientManager {
  private clients: Record<string, DataSource> = {};
  private baseConfigCreator: Promise<TypeORMConfig> = inject(
    tokenTypeORMConfigCreator
  );
  private baseConfig: TypeORMConfig | null = null;
  public isInitialized = false;

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    const baseConfig = await this.baseConfigCreator;
    this.baseConfig = baseConfig;
    this.clients.default = new DataSource({
      ...baseConfig,
      entities: [Tenant],
    });
    this.isInitialized = true;
  }

  public async initializeDefaultDatabase(): Promise<DataSource> {
    const client = await this.getClient();
    await client.query(
      'CREATE TABLE IF NOT EXISTS "tenants" (id varchar PRIMARY KEY, "databaseName" varchar UNIQUE NOT NULL, "createdAt" timestamptz NOT NULL DEFAULT now());'
    );
    return client;
  }

  private toDatabaseName(identifier: string): string {
    return `database_${identifier.replace(/[^A-Za-z_0-9]/g, '_')}`;
  }

  public async getClient(id?: string): Promise<DataSource> {
    id = id ?? 'default';
    if (!this.baseConfig) {
      throw new Error(
        'TypeORMClientManager not initialized. Call initialize() first.'
      );
    }
    if (!this.clients[id]) {
      this.clients[id] = new DataSource({
        ...this.baseConfig,
        database: this.toDatabaseName(id),
      });
    }
    if (!this.clients[id].isInitialized) {
      await this.clients[id].initialize();
    }
    return this.clients[id];
  }

  public async clearClients(): Promise<void> {
    const clients = Object.values(this.clients);
    await Promise.all(
      clients.map(async (client) => {
        const entities = client.entityMetadatas;
        const tableNames = entities.map((entity) => `"${entity.tableName}"`);
        if (tableNames.length === 0) return;
        await client.query(`TRUNCATE TABLE ${tableNames.join(', ')} CASCADE;`);
      })
    );
  }

  public async closeConnections(): Promise<void> {
    const clients = Object.values(this.clients);
    await Promise.all(
      clients.map(async (client) => {
        if (client.isInitialized) {
          await client.destroy();
        }
      })
    );
    this.clients = {};
  }

  private async createDatabase(id: string): Promise<void> {
    const databaseName = this.toDatabaseName(id);
    const defaultClient = await this.getClient();
    const databaseAlreadyExists = await defaultClient
      .getRepository(Tenant)
      .findOneBy({ id });
    if (!databaseAlreadyExists) {
      await defaultClient.query(`CREATE DATABASE "${databaseName}";`);
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
}

export const tokenTypeORMClientManager =
  createInjectionToken<TypeORMClientManager>('TypeORMClientManager', {
    useClass: MultiDatabaseTypeORMClientManager,
  });
