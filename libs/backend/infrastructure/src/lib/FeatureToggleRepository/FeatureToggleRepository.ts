import { FeatureTogglePort } from '@backend/ports';
import { createInjectionToken, inject } from '@shared/di-container';
import {
  tokenMonthlySubscriptionProductCode,
  tokenUnitBasedProductCode,
} from '../MarketplaceService';

export class FeatureToggleRepository implements FeatureTogglePort {
  private readonly marketplaceUnitBasedProductCode = inject(
    tokenUnitBasedProductCode
  );
  private readonly marketplaceMonthlySubscriptionProductCode = inject(
    tokenMonthlySubscriptionProductCode
  );

  public marketplaceIntegration(): boolean {
    return (
      this.marketplaceUnitBasedProductCode !== undefined &&
      this.marketplaceMonthlySubscriptionProductCode !== undefined
    );
  }
}

export const tokenFeatureToggleRepository =
  createInjectionToken<FeatureTogglePort>('FeatureToggleRepository', {
    useClass: FeatureToggleRepository,
  });
