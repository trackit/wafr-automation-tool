import { type BillingInformation } from '@backend/models';
import { type CostExplorerPort } from '@backend/ports';
import { createInjectionToken } from '@shared/di-container';

export class FakeCostExplorerService implements CostExplorerPort {
  public async getBillingInformation(_args: {
    accountId: string;
    timePeriod: { startDate: string; endDate: string };
    regions: string[];
    roleArn: string;
  }): Promise<BillingInformation> {
    return {} as BillingInformation;
  }
}

export const tokenFakeCostExplorerService =
  createInjectionToken<FakeCostExplorerService>('FakeCostExplorerService', {
    useClass: FakeCostExplorerService,
  });
