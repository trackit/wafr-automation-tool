import {
  AgreementStatus,
  DescribeAgreementCommand,
  MarketplaceAgreementClient,
} from '@aws-sdk/client-marketplace-agreement';
import {
  GetEntitlementsCommand,
  MarketplaceEntitlementServiceClient,
} from '@aws-sdk/client-marketplace-entitlement-service';
import {
  BatchMeterUsageCommand,
  MarketplaceMeteringClient,
} from '@aws-sdk/client-marketplace-metering';

import type { MarketplacePort } from '@backend/ports';
import { createInjectionToken, inject } from '@shared/di-container';

import { tokenLogger } from '../Logger';

export enum PricingDimension {
  UnitBased = 'unit',
  Monthly = 'monthly_plan',
}

export class MarketplaceService implements MarketplacePort {
  private readonly meteringClient = inject(tokenMarketplaceMeteringClient);
  private readonly entitlementClient = inject(
    tokenMarketplaceEntitlementServiceClient
  );
  private readonly agreementClient = inject(tokenMarketplaceAgreementClient);
  private readonly logger = inject(tokenLogger);
  private readonly unitBasedProductCode = inject(tokenUnitBasedProductCode);
  private readonly monthlySubscriptionProductCode = inject(
    tokenMonthlySubscriptionProductCode
  );

  public async hasMonthlySubscription(args: {
    accountId: string;
  }): Promise<boolean> {
    const { accountId } = args;
    const command = new GetEntitlementsCommand({
      ProductCode: this.monthlySubscriptionProductCode,
      Filter: {
        CUSTOMER_AWS_ACCOUNT_ID: [accountId],
        DIMENSION: [PricingDimension.Monthly],
      },
    });

    const response = await this.entitlementClient.send(command);
    if (response.$metadata.httpStatusCode !== 200) {
      throw new Error(JSON.stringify(response));
    }
    this.logger.info(`Get entitlements for customer: ${accountId}`);
    if (response.Entitlements?.[0]?.ExpirationDate) {
      return new Date(response.Entitlements[0].ExpirationDate) > new Date();
    }
    return false;
  }

  public async hasUnitBasedSubscription(args: {
    unitBasedAgreementId: string;
  }): Promise<boolean> {
    const { unitBasedAgreementId } = args;
    const cmd = new DescribeAgreementCommand({
      agreementId: unitBasedAgreementId,
    });

    const response = await this.agreementClient.send(cmd);
    if (response.$metadata.httpStatusCode !== 200) {
      throw new Error(JSON.stringify(response));
    }
    this.logger.info(`DescribeAgreement for ${unitBasedAgreementId}`);
    return response.status === AgreementStatus.ACTIVE;
  }

  public async consumeReviewUnit(args: { accountId: string }): Promise<void> {
    const { accountId } = args;

    const cmd = new BatchMeterUsageCommand({
      ProductCode: this.unitBasedProductCode,
      UsageRecords: [
        {
          CustomerAWSAccountId: accountId,
          Dimension: PricingDimension.UnitBased,
          Quantity: 1,
          Timestamp: new Date(),
        },
      ],
    });

    const response = await this.meteringClient.send(cmd);
    if (response.$metadata.httpStatusCode !== 200) {
      throw new Error(JSON.stringify(response));
    }
    this.logger.info(`RegisterUsage for ${accountId}`);
  }
}

export const tokenMarketplaceService = createInjectionToken<MarketplacePort>(
  'MarketplaceService',
  {
    useClass: MarketplaceService,
  }
);

export const tokenMarketplaceMeteringClient =
  createInjectionToken<MarketplaceMeteringClient>('MarketplaceMeteringClient', {
    useFactory: () =>
      new MarketplaceMeteringClient({
        region: 'us-east-1', // Service only supports us-east-1
      }),
  });

export const tokenMarketplaceEntitlementServiceClient =
  createInjectionToken<MarketplaceEntitlementServiceClient>(
    'MarketplaceEntitlementServiceClient',
    {
      useFactory: () =>
        new MarketplaceEntitlementServiceClient({
          region: 'us-east-1', // Service only supports us-east-1
        }),
    }
  );

export const tokenMarketplaceAgreementClient =
  createInjectionToken<MarketplaceAgreementClient>(
    'MarketplaceAgreementClient',
    {
      useFactory: () =>
        new MarketplaceAgreementClient({
          region: 'us-east-1', // Service only supports us-east-1
        }),
    }
  );

export const tokenUnitBasedProductCode = createInjectionToken<
  string | undefined
>('UnitBasedProductCode', {
  useValue: process.env.UNIT_BASED_PRICING_PRODUCT_CODE,
});

export const tokenMonthlySubscriptionProductCode = createInjectionToken<
  string | undefined
>('MonthlySubscriptionProductCode', {
  useValue: process.env.MONTHLY_SUBSCRIPTION_PRODUCT_CODE,
});
