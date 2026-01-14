import {
  CostExplorerClient,
  type CostExplorerClientConfig,
  type Expression,
  GetCostAndUsageCommand,
  type GetCostAndUsageCommandInput,
  GetDimensionValuesCommand,
  type GetDimensionValuesCommandInput,
} from '@aws-sdk/client-cost-explorer';

import { type BillingInformation } from '@backend/models';
import { type CostExplorerPort } from '@backend/ports';
import { createInjectionToken, inject } from '@shared/di-container';

import { tokenLogger } from '../Logger';
import { tokenSTSService } from '../STSService';

function buildFilter(
  serviceValues: string[],
  regionValues: string[],
  accountId: string,
): Expression {
  const andClauses: Expression[] = [
    { Dimensions: { Key: 'LINKED_ACCOUNT', Values: [accountId] } },
    { Dimensions: { Key: 'SERVICE', Values: serviceValues } },
  ];
  if (regionValues?.length > 0) {
    andClauses.push({ Dimensions: { Key: 'REGION', Values: regionValues } });
  }
  return { And: andClauses };
}

export class CostExplorerService implements CostExplorerPort {
  private readonly logger = inject(tokenLogger);

  private readonly stsService = inject(tokenSTSService);
  private readonly CostExplorerClientConstructor = inject(
    tokenCostExplorerClientConstructor,
  );

  public async createCostExplorerClient(
    roleArn: string,
  ): Promise<CostExplorerClient> {
    const credentials = await this.stsService.assumeRole({ roleArn });
    if (!credentials) {
      throw new Error(`Failed to assume role: ${roleArn}`);
    }
    return this.CostExplorerClientConstructor({
      credentials: {
        accessKeyId: credentials.accessKeyId!,
        secretAccessKey: credentials.secretAccessKey!,
        sessionToken: credentials.sessionToken!,
      },
      region: 'us-east-1',
    });
  }

  public async getDimensionValues({
    client,
    timePeriod,
  }: {
    client: CostExplorerClient;
    timePeriod: { startDate: string; endDate: string };
  }): Promise<string[]> {
    const base: GetDimensionValuesCommandInput = {
      Dimension: 'SERVICE',
      TimePeriod: {
        Start: timePeriod.startDate,
        End: timePeriod.endDate,
      },
    };
    const cmd = new GetDimensionValuesCommand(base);
    const resp = await client.send(cmd);
    const dimensionValues = (resp.DimensionValues ?? [])
      .map((dv) => dv.Value ?? '')
      .filter((v) => v !== '');
    if (dimensionValues.length === 0) {
      this.logger.warn('No services found for the specified time period.');
    }
    return dimensionValues;
  }

  public async getBillingInformation({
    accountId,
    timePeriod,
    regions,
    roleArn,
  }: {
    accountId: string;
    timePeriod: { startDate: string; endDate: string };
    regions: string[];
    roleArn: string;
  }): Promise<BillingInformation> {
    const client = await this.createCostExplorerClient(roleArn);
    const services = await this.getDimensionValues({ client, timePeriod });
    const serviceResourceInput: GetCostAndUsageCommandInput = {
      Filter: buildFilter(services, regions, accountId),
      Granularity: 'MONTHLY',
      TimePeriod: {
        Start: timePeriod.startDate,
        End: timePeriod.endDate,
      },
      Metrics: ['BlendedCost'],
      GroupBy: [{ Type: 'DIMENSION', Key: 'SERVICE' }],
    };
    const serviceCmd = new GetCostAndUsageCommand(serviceResourceInput);

    const serviceResp = await client.send(serviceCmd);
    const serviceAgg: Record<string, number> = {};
    for (const result of serviceResp.ResultsByTime ?? []) {
      for (const group of result.Groups ?? []) {
        const serviceName = group.Keys?.[0] ?? 'Unknown';
        const amount =
          parseFloat(group.Metrics?.BlendedCost?.Amount ?? '0') || 0;
        if (amount < 0) continue;
        serviceAgg[serviceName] = (serviceAgg[serviceName] || 0) + amount;
      }
    }

    const servicesCost = Object.entries(serviceAgg).map(
      ([serviceName, total]) => ({
        serviceName,
        cost: total.toFixed(2),
      }),
    );

    const totalCostNumber = Object.values(serviceAgg).reduce(
      (acc, total) => acc + total,
      0,
    );

    const billingInformation: BillingInformation = {
      billingPeriodStartDate: new Date(timePeriod.startDate),
      billingPeriodEndDate: new Date(timePeriod.endDate),
      totalCost: totalCostNumber.toFixed(2),
      servicesCost,
    };
    return billingInformation;
  }
}

export const tokenCostExplorerService = createInjectionToken<CostExplorerPort>(
  'CostExplorerService',
  { useClass: CostExplorerService },
);

export const tokenCostExplorerClientConstructor = createInjectionToken<
  CostExplorerClient['constructor']
>('CostExplorerClientConstructor', {
  useFactory: () => {
    return (...args: [] | [CostExplorerClientConfig]) =>
      new CostExplorerClient(...args);
  },
});
