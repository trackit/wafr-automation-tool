import { type FeatureTogglePort } from '@backend/ports';
import { createInjectionToken } from '@shared/di-container';

export class FakeFeatureToggleRepository implements FeatureTogglePort {
  marketplaceIntegration(): boolean {
    // no-op for testing
    return false;
  }
}

export const tokenFakeFeatureToggleRepository =
  createInjectionToken<FakeFeatureToggleRepository>(
    'FakeFeatureToggleRepository',
    {
      useClass: FakeFeatureToggleRepository,
    },
  );
