import { inject, reset } from '@shared/di-container';

import {
  AssessmentEntity,
  startPostgresContainer,
  Tenant,
} from '../infrastructure';
import { registerTestInfrastructure } from '../registerTestInfrastructure';
import {
  MultiDatabaseTypeORMClientManager,
  tokenTypeORMClientManager,
} from './MultiDatabaseTypeORMClientManager';
let pgContainer: Awaited<ReturnType<typeof startPostgresContainer>>;

beforeAll(async () => {
  pgContainer = await startPostgresContainer();
  const { clientManager } = setup();

  await clientManager.initialize();
  await clientManager.createClient('organization1');
  await clientManager.createClient('organization2');
}, 30000);

afterEach(async () => {
  const clientManager = inject(tokenTypeORMClientManager);
  await clientManager.clearClients();
  await clientManager.closeConnections();
});

afterAll(async () => {
  await pgContainer.stop();
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

    it('should return existing initialized client without checking credentials', async () => {
      const { clientManager } = setup();
      await clientManager.initialize();

      const client1 = await clientManager.getClient('organization1');

      const spyRefresh = vi.spyOn(clientManager, 'refreshCredentials');

      // Overwrite baseConfig to simulate stale credentials
      clientManager['baseConfig'] = {
        ...clientManager['baseConfig']!,
        password: 'invalid_password',
      };

      const client2 = await clientManager.getClient('organization1');

      expect(client1.isInitialized).toBe(true);
      expect(spyRefresh).not.toHaveBeenCalled();
      expect(client2).toBe(client1);
      expect(client2.isInitialized).toBe(true);
    });

    it('should auto-refresh credentials when getClient fails with stale password', async () => {
      const { clientManager } = setup();
      await clientManager.initialize();

      const spyRefresh = vi.spyOn(clientManager, 'refreshCredentials');

      // Overwrite baseConfig to simulate stale credentials
      clientManager['baseConfig'] = {
        ...clientManager['baseConfig']!,
        password: 'invalid_rotated_password',
      };

      const client = await clientManager.getClient('organization1');

      expect(spyRefresh).toHaveBeenCalled();
      expect(client).toBeDefined();
      expect(client.isInitialized).toBe(true);
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

  describe('credential rotation', () => {
    it('existing connections should continue to work after credentials rotate', async () => {
      const { clientManager } = setup();
      await clientManager.initialize();

      const client = await clientManager.getClient('organization1');
      const result1 = client.getRepository(AssessmentEntity);

      clientManager['baseConfig'] = {
        ...clientManager['baseConfig']!,
        password: 'invalid_rotated_password',
      };

      const result2 = await client.query('SELECT 1');

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });

    it('should call refetch mechanism on invalid password error', async () => {
      const { clientManager } = setup();

      const refreshCredentialsSpy = vi.spyOn(
        clientManager,
        'refreshCredentials',
      );

      await clientManager.initialize();
      const initialCallCount = refreshCredentialsSpy.mock.calls.length;

      clientManager['baseConfig'] = {
        ...clientManager['baseConfig']!,
        password: 'invalid_rotated_password',
      };

      await clientManager.createClient('organization1');
      const afterCallCount = refreshCredentialsSpy.mock.calls.length;

      expect(afterCallCount).toBeGreaterThan(initialCallCount);
      expect(clientManager.clients['organization1']).toBeDefined();
    });

    it('should track credential refresh attempts when getClient is called multiple times with stale creds', async () => {
      const { clientManager } = setup();
      await clientManager.initialize();

      const spyRefresh = vi.spyOn(clientManager, 'refreshCredentials');

      clientManager['baseConfig'] = {
        ...clientManager['baseConfig']!,
        password: 'invalid_password_1',
      };

      await clientManager.getClient('organization1');
      const spyRefreshCallsAtAttempt1 = spyRefresh.mock.calls.length;

      clientManager['baseConfig'] = {
        ...clientManager['baseConfig']!,
        password: 'invalid_password_2',
      };

      await clientManager.getClient('organization2');
      const spyRefreshCallsAtAttempt2 = spyRefresh.mock.calls.length;

      expect(spyRefreshCallsAtAttempt1).toBe(1);
      expect(spyRefreshCallsAtAttempt2).toBe(2);
    });

    it('should retry up to 5 times then fail if credentials are always invalid', async () => {
      const { clientManager } = setup();
      await clientManager.initialize();

      const refreshSpy = vi.spyOn(clientManager, 'refreshCredentials');

      // Mock refreshCredentials to always return bad credentials
      refreshSpy.mockImplementation(async () => {
        clientManager['baseConfig'] = {
          ...clientManager['baseConfig']!,
          password: 'always_invalid_password',
        };
      });

      await clientManager.refreshCredentials();

      await expect(clientManager.getClient('organization1')).rejects.toThrow(
        /password authentication failed/,
      );

      expect(refreshSpy).toHaveBeenCalledTimes(5);
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
          'organization1',
        )}';`,
      );
      expect(result).toHaveLength(1);
      expect(result[0].datname).toBe(
        clientManager.toDatabaseName('organization1'),
      );
    });

    it('should create new client after credentials rotation ', async () => {
      const { clientManager } = setup();

      await clientManager.initialize();

      const validClient = await clientManager.createClient('organization1');

      const spyRefresh = vi.spyOn(clientManager, 'refreshCredentials');

      //Overwrite the baseConfig to simulate rotated credentials
      clientManager['baseConfig'] = {
        ...clientManager['baseConfig']!,
        password: 'invalid_before_rotation_password',
      };

      const created = await clientManager.createClient('organization_new');

      expect(validClient.isInitialized).toBe(true);
      expect(created).toBeDefined();
      expect(created.isInitialized).toBe(true);
      expect(spyRefresh).toHaveBeenCalled();
    });
  });

  describe('closeConnections', () => {
    it('should close all client connections', async () => {
      const { clientManager } = setup();
      await clientManager.initialize();
      const destroySpies = Object.values(clientManager.clients).map((client) =>
        vi.spyOn(client, 'destroy'),
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
          const results = await client.query(`SELECT * FROM "${tableName}";`);
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
