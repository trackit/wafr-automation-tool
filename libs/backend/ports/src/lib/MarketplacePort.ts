export interface MarketplacePort {
  hasMonthlySubscription(args: { accountId: string }): Promise<boolean>;
  hasUnitBasedSubscription(args: {
    unitBasedAgreementId: string;
  }): Promise<boolean>;
  consumeReviewUnit(args: { accountId: string }): Promise<void>;
}
