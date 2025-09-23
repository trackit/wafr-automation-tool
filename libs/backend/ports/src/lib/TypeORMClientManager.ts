import type { DataSource } from 'typeorm';

export interface TypeORMClientManager {
  initializeDefaultDatabase(): Promise<DataSource>;
  getClient(id: string): Promise<DataSource>;
  createClient(id: string): Promise<DataSource>;
  clearClients(): Promise<void>;
  closeConnections(): Promise<void>;
}
