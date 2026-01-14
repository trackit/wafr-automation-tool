import {
  GetBillingInformationAdapter,
  type GetBillingInformationOutput,
} from './GetBillingInformationAdapter';

const adapter = new GetBillingInformationAdapter();

export const main = async (
  event: Record<string, unknown>,
): Promise<GetBillingInformationOutput> => await adapter.handle(event);
