import { inject, reset } from '@shared/di-container';

import { Tenant } from '../infrastructure';
import { registerTestInfrastructure } from '../registerTestInfrastructure';
import {
  MultiDatabaseTypeORMClientManager,
  tokenTypeORMClientManager,
} from './MultiDatabaseTypeORMClientManager';

beforeAll(async () => {
  const { clientManager } = setup();
  await clientManager.initialize();
  await clientManager.createClient('organization1');
  await clientManager.createClient('organization2');
});

afterEach(async () => {
  const clientManager = inject(tokenTypeORMClientManager);
  await clientManager.clearClients();
  await clientManager.closeConnections();
});

describe('MultiDatabaseTypeORMClientManager', () => {
  describe('getClient', () => {
    it('should return the default client if no id is provided', async () => {
      const { clientManager } = setup();
      await clientManager.initialize();
      const client = await clientManager.getClient();
      expect(client).toBe(clientManager.clients.default);
    });

    it('should return a new client for a new id', async () => {
      const { clientManager } = setup();
      await clientManager.initialize();
      const client1 = await clientManager.getClient('organization1');
      const client2 = await clientManager.getClient('organization2');
      expect(client1).not.toBe(client2);
    });

    it('should return the same client for the same id', async () => {
      const { clientManager } = setup();
      await clientManager.initialize();
      const client1 = await clientManager.getClient('organization1');
      const client2 = await clientManager.getClient('organization1');
      expect(client1).toBe(client2);
    });
  });

  describe('initialize', () => {
    it('should set isInitialized to true after initialization', async () => {
      const { clientManager } = setup();
      expect(clientManager.isInitialized).toBe(false);
      await clientManager.initialize();
      expect(clientManager.isInitialized).toBe(true);
    });

    it('should not re-initialize if already initialized', async () => {
      const { clientManager } = setup();
      await clientManager.initialize();
      const spy = vi.spyOn(clientManager.clients.default, 'initialize');
      await clientManager.initialize();
      expect(spy).toHaveBeenCalledTimes(0);
    });
  });

  describe('createClient', () => {
    it('should create and return a new client for a given id', async () => {
      const { clientManager } = setup();
      await clientManager.initialize();
      const client = await clientManager.createClient('organization1');
      expect(client).toBeDefined();
      expect(clientManager.clients['organization1']).toBe(client);
    });

    it('should create a new database for the new client', async () => {
      const { clientManager } = setup();
      await clientManager.initialize();
      await clientManager.createClient('organization1');
      const defaultClientManager = await clientManager.getClient();
      const result = await defaultClientManager.query(
        `SELECT datname FROM pg_database WHERE datname = '${clientManager.toDatabaseName(
          'organization1'
        )}';`
      );
      expect(result).toHaveLength(1);
      expect(result[0].datname).toBe(
        clientManager.toDatabaseName('organization1')
      );
    });
  });

  describe('closeConnections', () => {
    it('should close all client connections', async () => {
      const { clientManager } = setup();
      await clientManager.initialize();
      const destroySpies = Object.values(clientManager.clients).map((client) =>
        vi.spyOn(client, 'destroy')
      );
      await clientManager.closeConnections();
      for (const spy of destroySpies) {
        expect(spy).toHaveBeenCalled();
      }
    });
  });

  describe('clearClients', () => {
    it('should clear all tables from all clients', async () => {
      const { clientManager } = setup();
      await clientManager.initialize();

      // Insert dummy data
      const client = await clientManager.getClient();
      await client.getRepository(Tenant).save({
        id: 'tenant1',
        databaseName: 'db1',
      });

      const clients = Object.values(clientManager.clients);
      const clientsTableNames = clients.map((client) => ({
        tableNames: client.entityMetadatas.map((e) => e.tableName),
        client,
      }));
      await clientManager.clearClients();
      for (const { tableNames, client } of clientsTableNames) {
        for (const tableName of tableNames) {
          const results = await client.query(`SELECT * FROM ${tableName};`);
          expect(results).toHaveLength(0);
        }
      }
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  return {
    clientManager: new MultiDatabaseTypeORMClientManager(),
  };
};
