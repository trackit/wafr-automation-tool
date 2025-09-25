import { CustomerType, User, UserMother } from '@backend/models';

import { CreateOpportunityUseCaseArgs } from './CreateOpportunityUseCase';

export class CreateOpportunityUseCaseArgsMother {
  private data: CreateOpportunityUseCaseArgs;
  private constructor(data: CreateOpportunityUseCaseArgs) {
    this.data = data;
  }

  public static basic(): CreateOpportunityUseCaseArgsMother {
    return new CreateOpportunityUseCaseArgsMother({
      assessmentId: 'assessment-id',
      user: UserMother.basic().build(),
      opportunityDetails: {
        companyName: 'testCompany',
        duns: '123456789',
        industry: 'Aerospace',
        customerType: CustomerType.INTERNAL_WORKLOAD,
        companyWebsiteUrl: 'https://test.io',
        customerCountry: 'US',
        customerPostalCode: '1111',
        monthlyRecurringRevenue: '1111',
        targetCloseDate: '2097-01-01',
      },
    });
  }

  public withAssessmentId(
    assessmentId: string
  ): CreateOpportunityUseCaseArgsMother {
    this.data.assessmentId = assessmentId;
    return this;
  }

  public withUser(user: User): CreateOpportunityUseCaseArgsMother {
    this.data.user = user;
    return this;
  }

  public withCompanyName(
    companyName: string
  ): CreateOpportunityUseCaseArgsMother {
    this.data.opportunityDetails.companyName = companyName;
    return this;
  }

  public withDuns(duns: string): CreateOpportunityUseCaseArgsMother {
    this.data.opportunityDetails.duns = duns;
    return this;
  }

  public withIndustry(industry: string): CreateOpportunityUseCaseArgsMother {
    this.data.opportunityDetails.industry = industry;
    return this;
  }

  public withCustomerType(
    customerType: CustomerType
  ): CreateOpportunityUseCaseArgsMother {
    this.data.opportunityDetails.customerType = customerType;
    return this;
  }

  public withCompanyWebsiteUrl(
    companyWebsiteUrl: string
  ): CreateOpportunityUseCaseArgsMother {
    this.data.opportunityDetails.companyWebsiteUrl = companyWebsiteUrl;
    return this;
  }

  public withCustomerCountry(
    customerCountry: string
  ): CreateOpportunityUseCaseArgsMother {
    this.data.opportunityDetails.customerCountry = customerCountry;
    return this;
  }

  public withCustomerPostalCode(
    customerPostalCode: string
  ): CreateOpportunityUseCaseArgsMother {
    this.data.opportunityDetails.customerPostalCode = customerPostalCode;
    return this;
  }

  public withMonthlyRecurringRevenue(
    monthlyRecurringRevenue: string
  ): CreateOpportunityUseCaseArgsMother {
    this.data.opportunityDetails.monthlyRecurringRevenue =
      monthlyRecurringRevenue;
    return this;
  }

  public withTargetCloseDate(
    targetCloseDate: string
  ): CreateOpportunityUseCaseArgsMother {
    this.data.opportunityDetails.targetCloseDate = targetCloseDate;
    return this;
  }

  public withCustomerCity(
    customerCity: string | undefined
  ): CreateOpportunityUseCaseArgsMother {
    this.data.opportunityDetails.customerCity = customerCity;
    return this;
  }

  public withCustomerAddress(
    customerAddress: string | undefined
  ): CreateOpportunityUseCaseArgsMother {
    this.data.opportunityDetails.customerAddress = customerAddress;
    return this;
  }

  public build(): CreateOpportunityUseCaseArgs {
    return this.data;
  }
}
