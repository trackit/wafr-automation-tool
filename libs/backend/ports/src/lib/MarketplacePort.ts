export interface MarketplacePort {
  hasMonthlySubscription(args: { customerAccountId: string }): Promise<boolean>;
  hasUnitBasedSubscription(args: { agreementId?: string }): Promise<boolean>;
  consumeReviewUnit(args: { customerAccountId: string }): Promise<void>;
}
