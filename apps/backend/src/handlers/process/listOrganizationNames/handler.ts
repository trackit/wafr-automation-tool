import { ListOrganizationNamesAdapter } from './ListOrganizationNamesAdapter';

const adapter = new ListOrganizationNamesAdapter();

export const main = async (): Promise<string[]> => adapter.handle();
