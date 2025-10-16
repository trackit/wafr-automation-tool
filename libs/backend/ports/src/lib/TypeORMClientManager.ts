import type { DataSource } from 'typeorm';

export interface TypeORMClientManager {
  isInitialized: boolean;
  initialize(): Promise<void>;
  getClient(id?: string): Promise<DataSource>;
  createClient(id: string): Promise<DataSource>;
  clearClients(): Promise<void>;
  closeConnections(): Promise<void>;
}
