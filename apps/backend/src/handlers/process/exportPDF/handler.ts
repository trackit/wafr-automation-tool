import { ExportPDFAdapter } from './ExportPDFAdapter';

const adapter = new ExportPDFAdapter();

export const main = async (event: Record<string, unknown>): Promise<void> =>
  adapter.handle(event);
