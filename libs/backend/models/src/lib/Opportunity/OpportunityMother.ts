import { CountryCode, Industry } from '@aws-sdk/client-partnercentral-selling';

import { CustomerType, OpportunityDetails } from './Opportunity';

export class OpportunityDetailsMother {
  private data: OpportunityDetails;

  private constructor(data: OpportunityDetails) {
    this.data = data;
  }

  public static basic(): OpportunityDetailsMother {
    return new OpportunityDetailsMother({
      companyName: 'testCompany',
      duns: '123456789',
      industry: 'Aerospace',
      customerType: CustomerType.INTERNAL_WORKLOAD,
      companyWebsiteUrl: 'https://test.io',
      customerCountry: 'US',
      customerPostalCode: '1111',
      monthlyRecurringRevenue: '1111',
      targetCloseDate: '2097-01-01',
    });
  }

  public withCompanyName(companyName: string): OpportunityDetailsMother {
    this.data.companyName = companyName;
    return this;
  }

  public withDuns(duns: string): OpportunityDetailsMother {
    this.data.duns = duns;
    return this;
  }

  public withIndustry(industry: Industry): OpportunityDetailsMother {
    this.data.industry = industry;
    return this;
  }

  public withCustomerType(
    customerType: CustomerType,
  ): OpportunityDetailsMother {
    this.data.customerType = customerType;
    return this;
  }

  public withCompanyWebsiteUrl(url: string): OpportunityDetailsMother {
    this.data.companyWebsiteUrl = url;
    return this;
  }

  public withCustomerCountry(country: CountryCode): OpportunityDetailsMother {
    this.data.customerCountry = country;
    return this;
  }

  public withCustomerPostalCode(postalCode: string): OpportunityDetailsMother {
    this.data.customerPostalCode = postalCode;
    return this;
  }

  public withMonthlyRecurringRevenue(mrr: string): OpportunityDetailsMother {
    this.data.monthlyRecurringRevenue = mrr;
    return this;
  }

  public withTargetCloseDate(date: string): OpportunityDetailsMother {
    this.data.targetCloseDate = date;
    return this;
  }

  public withCustomerCity(city: string | undefined): OpportunityDetailsMother {
    this.data.customerCity = city;
    return this;
  }

  public withCustomerAddress(
    address: string | undefined,
  ): OpportunityDetailsMother {
    this.data.customerAddress = address;
    return this;
  }

  public build(): OpportunityDetails {
    return this.data;
  }
}
