import {
  type CountryCode,
  type Industry,
} from '@aws-sdk/client-partnercentral-selling';

export interface OpportunityDetails {
  companyName: string;
  duns: string;
  industry: Industry;
  customerType: CustomerType;
  companyWebsiteUrl: string;
  customerCountry: CountryCode;
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
