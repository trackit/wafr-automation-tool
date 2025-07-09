/* eslint-disable @typescript-eslint/no-unused-vars */
import { MarketplacePort } from '@backend/ports';
import { createInjectionToken } from '@shared/di-container';

export class FakeMarketplaceService implements MarketplacePort {
  async hasMonthlySubscription(args: {
    customerAccountId: string;
  }): Promise<boolean> {
    // No-op for fake implementation
    return false;
  }

  async hasUnitBasedSubscription(args: {
    agreementId?: string;
  }): Promise<boolean> {
    // No-op for fake implementation
    return false;
  }

  async consumeReviewUnit(args: { customerAccountId: string }): Promise<void> {
    // No-op for fake implementation
  }
}

export const tokenFakeMarketplaceService =
  createInjectionToken<FakeMarketplaceService>('FakeMarketplaceService', {
    useClass: FakeMarketplaceService,
  });
