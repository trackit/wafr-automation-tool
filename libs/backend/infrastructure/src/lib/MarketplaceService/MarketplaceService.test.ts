import { DeleteItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { DescribeAgreementCommand } from '@aws-sdk/client-marketplace-agreement';
import { GetEntitlementsCommand } from '@aws-sdk/client-marketplace-entitlement-service';
import { BatchMeterUsageCommand } from '@aws-sdk/client-marketplace-metering';
import { mockClient } from 'aws-sdk-client-mock';

import { OrganizationMother } from '@backend/models';
import { inject, reset } from '@shared/di-container';

import { tokenDynamoDBAssessmentTableName } from '../AssessmentsRepository';
import { tokenDynamoDBClient } from '../config/dynamodb/config';
import { registerTestInfrastructure } from '../registerTestInfrastructure';
import {
  MarketplaceService,
  tokenMarketplaceAgreementClient,
  tokenMarketplaceEntitlementServiceClient,
  tokenMarketplaceMeteringClient,
} from './MarketplaceService';

afterEach(async () => {
  const dynamoDBClient = inject(tokenDynamoDBClient);
  const tableName = inject(tokenDynamoDBAssessmentTableName);

  const scanResult = await dynamoDBClient.send(
    new ScanCommand({ TableName: tableName })
  );

  await Promise.all(
    (scanResult.Items || []).map(async (item) => {
      await dynamoDBClient.send(
        new DeleteItemCommand({
          TableName: tableName,
          Key: {
            PK: item.PK,
            SK: item.SK,
          },
        })
      );
    })
  );
});

describe('MarketplaceService', () => {
  describe('hasMonthlySubscription', () => {
    it('should return true if the user has a monthly subscription', async () => {
      const { marketplaceService, marketplaceEntitlementServiceClient } =
        setup();

      marketplaceEntitlementServiceClient.on(GetEntitlementsCommand).resolves({
        Entitlements: [
          {
            ExpirationDate: new Date(Date.now() + 1000),
          },
        ],
        $metadata: { httpStatusCode: 200 },
      });

      const hasMonthlySubscription =
        await marketplaceService.hasMonthlySubscription({
          organization: OrganizationMother.basic()
            .withAccountId('accountId')
            .build(),
        });

      expect(hasMonthlySubscription).toBe(true);
    });
    it('should return false if the user does not have a monthly subscription', async () => {
      const { marketplaceService, marketplaceEntitlementServiceClient } =
        setup();

      marketplaceEntitlementServiceClient.on(GetEntitlementsCommand).resolves({
        $metadata: { httpStatusCode: 200 },
      });

      const hasMonthlySubscription =
        await marketplaceService.hasMonthlySubscription({
          organization: OrganizationMother.basic()
            .withAccountId('accountId')
            .build(),
        });

      expect(hasMonthlySubscription).toBe(false);
    });
    it('should return false if the user has a monthly subscription but it is expired', async () => {
      const { marketplaceService, marketplaceEntitlementServiceClient } =
        setup();

      marketplaceEntitlementServiceClient.on(GetEntitlementsCommand).resolves({
        Entitlements: [
          {
            ExpirationDate: new Date(Date.now() - 1000),
          },
        ],
        $metadata: { httpStatusCode: 200 },
      });

      const hasMonthlySubscription =
        await marketplaceService.hasMonthlySubscription({
          organization: OrganizationMother.basic()
            .withAccountId('accountId')
            .build(),
        });

      expect(hasMonthlySubscription).toBe(false);
    });
    it('should return false if the organization has no account ID', async () => {
      const { marketplaceService } = setup();

      await expect(
        marketplaceService.hasMonthlySubscription({
          organization: OrganizationMother.basic()
            .withAccountId(undefined)
            .build(),
        })
      ).resolves.toBe(false);
    });
  });

  describe('hasUnitBasedSubscription', () => {
    it('should return true if the user has an active agreement', async () => {
      const { marketplaceService, marketplaceAgreementClient } = setup();

      marketplaceAgreementClient.on(DescribeAgreementCommand).resolves({
        agreementId: 'agreementId',
        status: 'ACTIVE',
        $metadata: { httpStatusCode: 200 },
      });

      const hasUnitBasedSubscription =
        await marketplaceService.hasUnitBasedSubscription({
          organization: OrganizationMother.basic()
            .withUnitBasedAgreementId('agreementId')
            .build(),
        });

      expect(hasUnitBasedSubscription).toBe(true);
    });
    it('should return false if the user does not have an active agreement', async () => {
      const { marketplaceService, marketplaceAgreementClient } = setup();

      marketplaceAgreementClient.on(DescribeAgreementCommand).resolves({
        agreementId: 'agreementId',
        status: 'EXPIRED',
        $metadata: { httpStatusCode: 200 },
      });

      const hasUnitBasedSubscription =
        await marketplaceService.hasUnitBasedSubscription({
          organization: OrganizationMother.basic()
            .withUnitBasedAgreementId('agreementId')
            .build(),
        });

      expect(hasUnitBasedSubscription).toBe(false);
    });
    it('should return false if the organization has no unit-based agreement ID', async () => {
      const { marketplaceService } = setup();

      await expect(
        marketplaceService.hasUnitBasedSubscription({
          organization: OrganizationMother.basic()
            .withUnitBasedAgreementId(undefined)
            .build(),
        })
      ).resolves.toBe(false);
    });
  });

  describe('consumeReviewUnit', () => {
    it('should consume a review unit', async () => {
      const { marketplaceService, marketplaceMeteringClient } = setup();

      marketplaceMeteringClient.on(BatchMeterUsageCommand).resolves({
        $metadata: { httpStatusCode: 200 },
      });

      await expect(
        marketplaceService.consumeReviewUnit({
          organization: OrganizationMother.basic()
            .withAccountId('accountId')
            .build(),
        })
      ).resolves.toBeUndefined();
    });
    it('should throw an error if consumeReviewUnit fails', async () => {
      const { marketplaceService, marketplaceMeteringClient } = setup();

      marketplaceMeteringClient.on(BatchMeterUsageCommand).resolves({
        $metadata: { httpStatusCode: 500 },
      });

      await expect(
        marketplaceService.consumeReviewUnit({
          organization: OrganizationMother.basic()
            .withAccountId('accountId')
            .build(),
        })
      ).rejects.toThrowError();
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  const marketplaceService = new MarketplaceService();
  const marketplaceAgreementClient = mockClient(
    inject(tokenMarketplaceAgreementClient)
  );
  const marketplaceEntitlementServiceClient = mockClient(
    inject(tokenMarketplaceEntitlementServiceClient)
  );
  const marketplaceMeteringClient = mockClient(
    inject(tokenMarketplaceMeteringClient)
  );
  return {
    marketplaceService,
    marketplaceAgreementClient,
    marketplaceEntitlementServiceClient,
    marketplaceMeteringClient,
  };
};
