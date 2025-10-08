import { MigrationRunnerAdapter } from './MigrationRunnerAdapter';

const adapter = new MigrationRunnerAdapter();

export const main = async (): Promise<void> => await adapter.handle();
