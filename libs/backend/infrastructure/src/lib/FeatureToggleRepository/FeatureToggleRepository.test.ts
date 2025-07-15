import { register, reset } from '@shared/di-container';
import {
  tokenMonthlySubscriptionProductCode,
  tokenUnitBasedProductCode,
} from '../MarketplaceService';
import { registerTestInfrastructure } from '../registerTestInfrastructure';
import { FeatureToggleRepository } from './FeatureToggleRepository';

describe('FeatureToggleRepository', () => {
  describe('marketplaceIntegration', () => {
    it('should return true if all marketplace variables are defined', () => {
      const { featureToggleRepository } = setup({
        removeMarketplaceVariables: false,
      });

      expect(featureToggleRepository.marketplaceIntegration()).toBe(true);
    });
    it('should return false if all marketplace variables are undefined', () => {
      const { featureToggleRepository } = setup({
        removeMarketplaceVariables: true,
      });

      expect(featureToggleRepository.marketplaceIntegration()).toBe(false);
    });
  });
});

const setup = ({ removeMarketplaceVariables = false } = {}) => {
  reset();
  registerTestInfrastructure();
  if (removeMarketplaceVariables) {
    register(tokenUnitBasedProductCode, {
      useFactory: () => undefined,
    });
    register(tokenMonthlySubscriptionProductCode, {
      useFactory: () => undefined,
    });
  }
  const featureToggleRepository = new FeatureToggleRepository();
  return {
    featureToggleRepository,
  };
};
