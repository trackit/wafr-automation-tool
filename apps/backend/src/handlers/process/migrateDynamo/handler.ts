import { MigrateDynamoAdapter } from './MigrateDynamoAdapter';

const adapter = new MigrateDynamoAdapter();

export const main = async (): Promise<void> => adapter.handle();
