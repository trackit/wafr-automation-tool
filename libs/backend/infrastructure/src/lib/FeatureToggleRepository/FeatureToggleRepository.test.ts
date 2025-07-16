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
        withMarketplaceVariables: true,
      });

      expect(featureToggleRepository.marketplaceIntegration()).toBe(true);
    });

    it('should return false if all marketplace variables are undefined', () => {
      const { featureToggleRepository } = setup({
        withMarketplaceVariables: false,
      });

      expect(featureToggleRepository.marketplaceIntegration()).toBe(false);
    });
  });
});

const setup = ({ withMarketplaceVariables = true } = {}) => {
  reset();
  registerTestInfrastructure();
  register(tokenUnitBasedProductCode, {
    useValue: withMarketplaceVariables
      ? 'test-unit-based-product-code'
      : undefined,
  });
  register(tokenMonthlySubscriptionProductCode, {
    useValue: withMarketplaceVariables
      ? 'test-monthly-subscription-product-code'
      : undefined,
  });
  const featureToggleRepository = new FeatureToggleRepository();
  return {
    featureToggleRepository,
  };
};
