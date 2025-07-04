import { PrepareCustodianAdapter } from './PrepareCustodianAdapter';

const adapter = new PrepareCustodianAdapter();

export const main = async (): Promise<string> => await adapter.handle();
