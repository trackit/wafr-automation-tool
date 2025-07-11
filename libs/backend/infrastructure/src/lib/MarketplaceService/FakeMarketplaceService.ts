/* eslint-disable @typescript-eslint/no-unused-vars */
import { Organization } from '@backend/models';
import { MarketplacePort } from '@backend/ports';
import { createInjectionToken } from '@shared/di-container';

export class FakeMarketplaceService implements MarketplacePort {
  async hasMonthlySubscription(args: {
    organization: Organization;
  }): Promise<boolean> {
    // No-op for fake implementation
    return false;
  }

  async hasUnitBasedSubscription(args: {
    organization: Organization;
  }): Promise<boolean> {
    // No-op for fake implementation
    return false;
  }

  async consumeReviewUnit(args: { organization: Organization }): Promise<void> {
    // No-op for fake implementation
  }
}

export const tokenFakeMarketplaceService =
  createInjectionToken<FakeMarketplaceService>('FakeMarketplaceService', {
    useClass: FakeMarketplaceService,
  });
