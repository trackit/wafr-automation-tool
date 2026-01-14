import { type MarketplacePort } from '@backend/ports';
import { createInjectionToken } from '@shared/di-container';

export class FakeMarketplaceService implements MarketplacePort {
  async hasMonthlySubscription(_args: { accountId: string }): Promise<boolean> {
    // No-op for fake implementation
    return false;
  }

  async hasUnitBasedSubscription(_args: {
    unitBasedAgreementId: string;
  }): Promise<boolean> {
    // No-op for fake implementation
    return false;
  }

  async consumeReviewUnit(_args: { accountId: string }): Promise<void> {
    // No-op for fake implementation
  }
}

export const tokenFakeMarketplaceService =
  createInjectionToken<FakeMarketplaceService>('FakeMarketplaceService', {
    useClass: FakeMarketplaceService,
  });
