import {
  PreparePromptsAdapter,
  type PreparePromptsOutput,
} from './PreparePromptsAdapter';

const adapter = new PreparePromptsAdapter();

export const main = async (
  event: Record<string, unknown>
): Promise<PreparePromptsOutput> => adapter.handle(event);
