import { InvokeLLMAdapter, InvokeLLMOutput } from './invokeLLM';

const adapter = new InvokeLLMAdapter();

export const main = async (
  event: Record<string, unknown>
): Promise<InvokeLLMOutput> => await adapter.handle(event);
