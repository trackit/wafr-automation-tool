import {
  registerTestInfrastructure,
  tokenTypeORMClientManager,
} from '@backend/infrastructure';
import { startPostgresContainer } from '@backend/infrastructure-test';
import { inject, reset } from '@shared/di-container';

import { MigrationRunnerAdapter } from './MigrationRunnerAdapter';

let pgContainer: Awaited<ReturnType<typeof startPostgresContainer>>;

beforeAll(async () => {
  reset();
  registerTestInfrastructure();
  pgContainer = await startPostgresContainer();

  const clientManager = inject(tokenTypeORMClientManager);
  await clientManager.initialize();
}, 30000);

afterEach(async () => {
  const clientManager = inject(tokenTypeORMClientManager);
  await clientManager.clearClients();
  await clientManager.closeConnections();
});

afterAll(async () => {
  await pgContainer.stop();
});

describe('MigrationRunnerAdapter', () => {
  it('should run migrations for default database', async () => {
    const { adapter, clientManager } = setup();
    await clientManager.initialize();
    const mainClient = await clientManager.getClient();
    vi.spyOn(mainClient, 'runMigrations').mockResolvedValue([]);
    await adapter.handle();
    expect(mainClient.runMigrations).toHaveBeenCalledExactlyOnceWith();
  });

  it('should run migrations for all tenants', async () => {
    const { adapter, clientManager } = setup();
    await clientManager.initialize();
    const client1 = await clientManager.createClient('organization1');
    const client2 = await clientManager.createClient('organization2');
    vi.spyOn(client1, 'runMigrations').mockResolvedValue([]);
    vi.spyOn(client2, 'runMigrations').mockResolvedValue([]);
    await adapter.handle();
    expect(client1.runMigrations).toHaveBeenCalledExactlyOnceWith();
    expect(client2.runMigrations).toHaveBeenCalledExactlyOnceWith();
  });

  it('should run migrations for default database before tenants', async () => {
    const { adapter, clientManager } = setup();
    await clientManager.initialize();
    const mainClient = await clientManager.getClient();
    const client1 = await clientManager.createClient('organization1');
    const client2 = await clientManager.createClient('organization2');
    const mainSpy = vi.spyOn(mainClient, 'runMigrations').mockResolvedValue([]);
    const spy1 = vi.spyOn(client1, 'runMigrations').mockResolvedValue([]);
    const spy2 = vi.spyOn(client2, 'runMigrations').mockResolvedValue([]);
    await adapter.handle();
    expect(mainSpy).toHaveBeenCalledBefore(spy1);
    expect(mainSpy).toHaveBeenCalledBefore(spy2);
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  return {
    adapter: new MigrationRunnerAdapter(),
    clientManager: inject(tokenTypeORMClientManager),
  };
};
