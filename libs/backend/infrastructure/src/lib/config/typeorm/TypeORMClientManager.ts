import {
  Column,
  CreateDateColumn,
  DataSource,
  Entity,
  PrimaryColumn,
} from 'typeorm';

import { createInjectionToken, inject } from '@shared/di-container';

import { tokenTypeORMConfig, TypeORMConfig } from './config';

@Entity('tenants')
export class Tenant {
  @PrimaryColumn('varchar')
  id!: string;

  @Column('varchar', { unique: true })
  databaseName!: string;

  @CreateDateColumn()
  createdAt!: Date;
}

export interface ITypeORMClientManager {
  initializeDefaultDatabase(): Promise<DataSource>;
  getClient(id: string): Promise<DataSource>;
  createClient(id: string): Promise<DataSource>;
  clearClients(): Promise<void>;
  closeConnections(): Promise<void>;
}

class TypeORMClientManager implements ITypeORMClientManager {
  private clients: Record<string, DataSource> = {};
  private baseConfig: TypeORMConfig = inject(tokenTypeORMConfig);

  constructor() {
    // Ensure the default database is always available
    this.clients.postgres = new DataSource({
      ...this.baseConfig,
      entities: [Tenant],
    });
  }

  public async initializeDefaultDatabase(): Promise<DataSource> {
    const client = await this.getClient('postgres');
    await client.query(
      'CREATE TABLE IF NOT EXISTS "tenants" (id varchar PRIMARY KEY, "databaseName" varchar UNIQUE NOT NULL, "createdAt" timestamptz NOT NULL DEFAULT now());'
    );
    return client;
  }

  private toDatabaseName(identifier: string): string {
    return `database_${identifier.replace(/[^A-Za-z_0-9]/g, '_')}`;
  }

  public async getClient(id: string): Promise<DataSource> {
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
    const defaultClient = await this.getClient('postgres');
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
  createInjectionToken<ITypeORMClientManager>('ClientManager', {
    useClass: TypeORMClientManager,
  });
