import z from 'zod';
import { CleanupAdapter, CleanupInput, CleanupOutput } from './Cleanup';

const adapter = new CleanupAdapter();

export const main = async (
  event: z.infer<typeof CleanupInput>
): Promise<CleanupOutput> => adapter.handle(event);
