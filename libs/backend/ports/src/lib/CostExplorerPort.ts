import { type BillingInformation } from '@backend/models';

export interface CostExplorerPort {
  getBillingInformation(args: {
    accountId: string;
    timePeriod: { startDate: string; endDate: string };
    regions: string[];
    roleArn: string;
  }): Promise<BillingInformation>;
}
