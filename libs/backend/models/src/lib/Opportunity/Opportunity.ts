export interface OpportunityDetails {
  companyName: string;
  duns: string;
  industry: string;
  customerType: CustomerType;
  companyWebsiteUrl: string;
  customerCountry: string;
  customerPostalCode: string;
  monthlyRecurringRevenue: string;
  targetCloseDate: string;
  customerCity?: string;
  customerAddress?: string;
}
export enum CustomerType {
  INTERNAL_WORKLOAD = 'INTERNAL_WORKLOAD',
  CUSTOMER = 'CUSTOMER',
}
