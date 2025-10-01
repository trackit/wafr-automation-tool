import { CleanupAdapter, CleanupOutput } from './CleanupAdapter';

const adapter = new CleanupAdapter();

export const main = async (
  event: Record<string, unknown>,
): Promise<CleanupOutput> => await adapter.handle(event);
