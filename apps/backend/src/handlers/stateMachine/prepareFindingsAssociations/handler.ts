import {
  PrepareFindingsAssociationsAdapter,
  type PrepareFindingsAssociationsOutput,
} from './PrepareFindingsAssociationsAdapter';

const adapter = new PrepareFindingsAssociationsAdapter();

export const main = async (
  event: Record<string, unknown>
): Promise<PrepareFindingsAssociationsOutput> => adapter.handle(event);
