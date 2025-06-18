import {
  ComputeGraphDataAdapter,
  ComputeGraphDataOutput,
} from './ComputeGraphAdapter';

const adapter = new ComputeGraphDataAdapter();

export const main = async (
  event: Record<string, unknown>
): Promise<ComputeGraphDataOutput> => await adapter.handle(event);
