import { registerTestInfrastructure } from '@backend/infrastructure';
import { tokenRunDatabaseMigrationsUseCase } from '@backend/useCases';
import { register, reset } from '@shared/di-container';

import { MigrationRunnerAdapter } from './MigrationRunnerAdapter';

describe('MigrationRunner adapter', () => {
  it('should call runDatabaseMigrations use case', async () => {
    const { useCase, adapter } = setup();
    await adapter.handle();
    expect(useCase.runDatabaseMigrations).toHaveBeenCalledExactlyOnceWith();
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  const useCase = { runDatabaseMigrations: vitest.fn() };
  register(tokenRunDatabaseMigrationsUseCase, { useValue: useCase });
  const adapter = new MigrationRunnerAdapter();
  return {
    useCase,
    adapter,
  };
};
