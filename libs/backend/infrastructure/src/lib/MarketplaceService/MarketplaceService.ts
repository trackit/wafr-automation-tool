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
import { Organization } from '@backend/models';
import type { MarketplacePort } from '@backend/ports';
import { createInjectionToken, inject } from '@shared/di-container';
import { InfrastructureError } from '../../Errors';
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
    organization: Organization;
  }): Promise<boolean> {
    const { organization } = args;

    const command = new GetEntitlementsCommand({
      ProductCode: this.monthlySubscriptionProductCode,
      Filter: {
        CUSTOMER_AWS_ACCOUNT_ID: [organization.accountId],
        DIMENSION: [PricingDimension.Monthly],
      },
    });
    try {
      const response = await this.entitlementClient.send(command);
      if (response.$metadata.httpStatusCode !== 200) {
        throw new InfrastructureError({
          message: `Failed to get entitlements: ${response.$metadata.httpStatusCode}`,
        });
      }
      this.logger.info(
        `Get entitlements for customer: ${organization.accountId}`
      );
      if (response.Entitlements?.[0]?.ExpirationDate) {
        return new Date(response.Entitlements[0].ExpirationDate) > new Date();
      }
      return false;
    } catch (error) {
      this.logger.error(`Failed to get entitlements for customer: ${error}`);
      throw error;
    }
  }

  public async hasUnitBasedSubscription(args: {
    organization: Organization;
  }): Promise<boolean> {
    const { organization } = args;

    const cmd = new DescribeAgreementCommand({
      agreementId: organization.unitBasedAgreementId,
    });
    try {
      const res = await this.agreementClient.send(cmd);
      if (res.$metadata.httpStatusCode !== 200) {
        throw new InfrastructureError({
          message: `Failed to get entitlements: ${res.$metadata.httpStatusCode}`,
        });
      }
      this.logger.info(
        `DescribeAgreement for ${organization.unitBasedAgreementId}:`,
        res
      );
      return res.status === AgreementStatus.ACTIVE;
    } catch (err) {
      this.logger.error(`Error fetching agreement: ${err}`);
      throw err;
    }
  }

  public async consumeReviewUnit(args: {
    organization: Organization;
  }): Promise<void> {
    const { organization } = args;

    const cmd = new BatchMeterUsageCommand({
      ProductCode: this.unitBasedProductCode,
      UsageRecords: [
        {
          CustomerAWSAccountId: organization.accountId,
          Dimension: PricingDimension.UnitBased,
          Quantity: 1,
          Timestamp: new Date(),
        },
      ],
    });
    try {
      const res = await this.meteringClient.send(cmd);
      if (res.$metadata.httpStatusCode !== 200) {
        throw new InfrastructureError({
          message: `RegisterUsage failed: ${res.$metadata.httpStatusCode}`,
        });
      }
      this.logger.info(`RegisterUsage for ${organization.accountId}:`, res);
    } catch (err) {
      this.logger.error(`Error fetching metering: ${err}`);
      throw err;
    }
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
  useFactory: () => {
    const productCode = process.env.UNIT_BASED_PRICING_PRODUCT_CODE;
    if (productCode === '') {
      return undefined;
    }
    return productCode;
  },
});

export const tokenMonthlySubscriptionProductCode = createInjectionToken<
  string | undefined
>('MonthlySubscriptionProductCode', {
  useFactory: () => {
    const productCode = process.env.MONTHLY_SUBSCRIPTION_PRODUCT_CODE;
    if (productCode === '') {
      return undefined;
    }
    return productCode;
  },
});
