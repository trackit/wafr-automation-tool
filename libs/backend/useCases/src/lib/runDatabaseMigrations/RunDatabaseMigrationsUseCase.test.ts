import {
  ITypeORMClientManager,
  registerTestInfrastructure,
  tokenTypeORMClientManager,
} from '@backend/infrastructure';
import { register, reset } from '@shared/di-container';

import { RunDatabaseMigrationsUseCaseImpl } from './RunDatabaseMigrationsUseCase';

describe('RunDatabaseMigrationUseCase', () => {});

const setup = () => {
  reset();
  registerTestInfrastructure();
  const useCase = new RunDatabaseMigrationsUseCaseImpl();
  const fakeTypeORMClientManager: ITypeORMClientManager = {
    initializeDefaultDatabase: vi.fn(),
    getClient: vi.fn(),
    closeConnections: vi.fn(),
    clearClients: vi.fn(),
    createClient: vi.fn(),
  };
  register(tokenTypeORMClientManager, { useValue: fakeTypeORMClientManager });
  return {
    useCase,
    fakeTypeORMClientManager,
  };
};
