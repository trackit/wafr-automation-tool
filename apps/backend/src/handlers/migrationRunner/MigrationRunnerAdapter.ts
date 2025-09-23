import { tokenRunDatabaseMigrationsUseCase } from '@backend/useCases';
import { inject } from '@shared/di-container';

export class MigrationRunnerAdapter {
  private readonly useCase = inject(tokenRunDatabaseMigrationsUseCase);

  public async handle(): Promise<void> {
    return this.useCase.runDatabaseMigrations();
  }
}
