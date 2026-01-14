import {
  AssociateFindingsChunkToBestPracticesAdapter,
  type AssociateFindingsChunkToBestPracticesOutput,
} from './AssociateFindingsChunkToBestPracticesAdapter';

const adapter = new AssociateFindingsChunkToBestPracticesAdapter();

export const main = async (
  event: Record<string, unknown>,
): Promise<AssociateFindingsChunkToBestPracticesOutput> =>
  await adapter.handle(event);
