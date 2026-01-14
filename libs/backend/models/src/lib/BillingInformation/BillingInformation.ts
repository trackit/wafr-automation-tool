export interface BillingInformation {
  billingPeriodStartDate: Date;
  billingPeriodEndDate: Date;
  totalCost: string;
  servicesCost: ServiceCost[];
}
export interface ServiceCost {
  serviceName: string;
  cost: string;
}
