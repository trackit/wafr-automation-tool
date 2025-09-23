import { DataSource } from 'typeorm';

import { TypeORMClientManager } from '@backend/ports';
import { createInjectionToken } from '@shared/di-container';

export class FakeMultiDatabaseTypeORMClientManager
  implements TypeORMClientManager
{
  async initializeDefaultDatabase(): Promise<DataSource> {
    return {} as DataSource;
  }

  async getClient(_id: string): Promise<DataSource> {
    return {} as DataSource;
  }

  async createClient(_id: string): Promise<DataSource> {
    return {} as DataSource;
  }

  async clearClients(): Promise<void> {
    return;
  }

  async closeConnections(): Promise<void> {
    return;
  }
}

export const tokenFakeMultiDatabaseTypeORMClientManager =
  createInjectionToken<FakeMultiDatabaseTypeORMClientManager>(
    'FakeMultiDatabaseTypeORMClientManager',
    {
      useClass: FakeMultiDatabaseTypeORMClientManager,
    }
  );
