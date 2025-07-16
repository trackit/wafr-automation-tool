import { Organization } from '@backend/models';

export interface MarketplacePort {
  hasMonthlySubscription(args: {
    organization: Organization;
  }): Promise<boolean>;
  hasUnitBasedSubscription(args: {
    organization: Organization;
  }): Promise<boolean>;
  consumeReviewUnit(args: { organization: Organization }): Promise<void>;
}
