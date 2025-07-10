import {
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
import { assertIsDefined } from '@shared/utils';
import { InfrastructureError } from '../../Errors';
import { tokenLogger } from '../Logger';

export enum PricingDimension {
  UnitBased = 'unit',
  Monthly = 'monthly_plan',
}

export class MarketplaceService implements MarketplacePort {
  private readonly meterclient = inject(tokenMarketplaceMeteringClient);
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
    customerAccountId: string;
  }): Promise<boolean> {
    const { customerAccountId } = args;

    const command = new GetEntitlementsCommand({
      ProductCode: this.monthlySubscriptionProductCode,
      Filter: {
        CUSTOMER_AWS_ACCOUNT_ID: [customerAccountId],
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
      this.logger.info(`Get entitlements for customer: ${customerAccountId}`);
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
    agreementId?: string;
  }): Promise<boolean> {
    const { agreementId } = args;

    const cmd = new DescribeAgreementCommand({
      agreementId,
    });
    try {
      const res = await this.agreementClient.send(cmd);
      if (res.$metadata.httpStatusCode !== 200) {
        throw new InfrastructureError({
          message: `Failed to get entitlements: ${res.$metadata.httpStatusCode}`,
        });
      }
      this.logger.info(`DescribeAgreement for ${agreementId}:`, res);
      return res.status === 'ACTIVE';
    } catch (err) {
      this.logger.error(`Error fetching agreement: ${err}`);
      throw err;
    }
  }

  public async consumeReviewUnit(args: {
    customerAccountId: string;
  }): Promise<void> {
    const { customerAccountId } = args;

    const cmd = new BatchMeterUsageCommand({
      ProductCode: this.unitBasedProductCode,
      UsageRecords: [
        {
          CustomerAWSAccountId: customerAccountId,
          Dimension: PricingDimension.UnitBased,
          Quantity: 1,
          Timestamp: new Date(),
        },
      ],
    });
    try {
      const res = await this.meterclient.send(cmd);
      if (res.$metadata.httpStatusCode !== 200) {
        throw new InfrastructureError({
          message: `RegisterUsage failed: ${res.$metadata.httpStatusCode}`,
        });
      }
      this.logger.info(`RegisterUsage for ${customerAccountId}:`, res);
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
        region: 'us-east-1',
      }),
  });

export const tokenMarketplaceEntitlementServiceClient =
  createInjectionToken<MarketplaceEntitlementServiceClient>(
    'MarketplaceEntitlementServiceClient',
    {
      useFactory: () =>
        new MarketplaceEntitlementServiceClient({
          region: 'us-east-1',
        }),
    }
  );

export const tokenMarketplaceAgreementClient =
  createInjectionToken<MarketplaceAgreementClient>(
    'MarketplaceAgreementClient',
    {
      useFactory: () =>
        new MarketplaceAgreementClient({
          region: 'us-east-1',
        }),
    }
  );

export const tokenUnitBasedProductCode = createInjectionToken<string>(
  'UnitBasedProductCode',
  {
    useFactory: () => {
      const productCode = process.env.UNIT_BASED_PRICING_PRODUCT_CODE;
      assertIsDefined(
        productCode,
        'UNIT_BASED_PRICING_PRODUCT_CODE is not defined'
      );
      return productCode;
    },
  }
);

export const tokenMonthlySubscriptionProductCode = createInjectionToken<string>(
  'MonthlySubscriptionProductCode',
  {
    useFactory: () => {
      const productCode = process.env.MONTHLY_SUBSCRIPTION_PRODUCT_CODE;
      assertIsDefined(
        productCode,
        'MONTHLY_SUBSCRIPTION_PRODUCT_CODE is not defined'
      );
      return productCode;
    },
  }
);
