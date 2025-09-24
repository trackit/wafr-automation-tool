import {
  registerTestInfrastructure,
  tokenTypeORMClientManager,
} from '@backend/infrastructure';
import { inject, reset } from '@shared/di-container';

import { RunDatabaseMigrationsUseCaseImpl } from './RunDatabaseMigrationsUseCase';

afterEach(async () => {
  const clientManager = inject(tokenTypeORMClientManager);
  await clientManager.clearClients();
});

afterAll(async () => {
  const clientManager = inject(tokenTypeORMClientManager);
  await clientManager.closeConnections();
});

describe('RunDatabaseMigrationUseCase', () => {
  it('should initialize default database', async () => {
    const { useCase, clientManager } = setup();
    vi.spyOn(clientManager, 'initializeDefaultDatabase');
    await useCase.runDatabaseMigrations();
    expect(
      clientManager.initializeDefaultDatabase
    ).toHaveBeenCalledExactlyOnceWith();
  });

  it('should run migrations for all tenants', async () => {
    const { useCase, clientManager } = setup();
    await clientManager.initialize();
    const client1 = await clientManager.createClient('organization1');
    const client2 = await clientManager.createClient('organization2');
    vi.spyOn(client1, 'runMigrations').mockResolvedValue([]);
    vi.spyOn(client2, 'runMigrations').mockResolvedValue([]);
    await useCase.runDatabaseMigrations();
    expect(client1.runMigrations).toHaveBeenCalledExactlyOnceWith();
    expect(client2.runMigrations).toHaveBeenCalledExactlyOnceWith();
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  return {
    useCase: new RunDatabaseMigrationsUseCaseImpl(),
    clientManager: inject(tokenTypeORMClientManager),
  };
};
