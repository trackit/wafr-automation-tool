import type { APIGatewayProxyEvent } from 'aws-lambda';

import { CustomerType, type User, UserMother } from '@backend/models';
import type { operations } from '@shared/api-schema';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';

type CreateOpportunityParameters =
  operations['createOpportunity']['parameters']['path'];

type CreateOpportunityBody =
  operations['createOpportunity']['requestBody']['content']['application/json'];

export class CreateOpportunityAdapterEventMother {
  private pathParameters: CreateOpportunityParameters;
  private body: CreateOpportunityBody;
  private user: Pick<User, 'id' | 'email'> = UserMother.basic().build();

  private constructor(
    params: CreateOpportunityParameters,
    body: CreateOpportunityBody,
  ) {
    this.pathParameters = params;
    this.body = body;
  }

  public static basic(): CreateOpportunityAdapterEventMother {
    return new CreateOpportunityAdapterEventMother(
      {
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      },
      {
        companyName: 'testCompany',
        duns: '123456789',
        industry: 'Aerospace',
        customerType: CustomerType.INTERNAL_WORKLOAD,
        companyWebsiteUrl: 'https://test.io',
        customerCountry: 'US',
        customerPostalCode: '1111',
        monthlyRecurringRevenue: '1111',
        targetCloseDate: '2097-01-01',
        customerCity: 'City',
        customerAddress: 'street',
      },
    );
  }
  public withAssessmentId(
    assessmentId: CreateOpportunityParameters['assessmentId'],
  ): CreateOpportunityAdapterEventMother {
    this.pathParameters.assessmentId = assessmentId;
    return this;
  }

  public withUser(
    user: Pick<User, 'id' | 'email'>,
  ): CreateOpportunityAdapterEventMother {
    this.user = user;
    return this;
  }
  public withCompanyName(
    companyName: string,
  ): CreateOpportunityAdapterEventMother {
    this.body.companyName = companyName;
    return this;
  }

  public withDuns(duns: string): CreateOpportunityAdapterEventMother {
    this.body.duns = duns;
    return this;
  }

  public withIndustry(industry: string): CreateOpportunityAdapterEventMother {
    this.body.industry = industry;
    return this;
  }

  public withCustomerType(
    customerType: CustomerType,
  ): CreateOpportunityAdapterEventMother {
    this.body.customerType = customerType;
    return this;
  }

  public withCompanyWebsiteUrl(
    companyWebsiteUrl: string,
  ): CreateOpportunityAdapterEventMother {
    this.body.companyWebsiteUrl = companyWebsiteUrl;
    return this;
  }

  public withCustomerCountry(
    customerCountry: string,
  ): CreateOpportunityAdapterEventMother {
    this.body.customerCountry = customerCountry;
    return this;
  }

  public withCustomerPostalCode(
    customerPostalCode: string,
  ): CreateOpportunityAdapterEventMother {
    this.body.customerPostalCode = customerPostalCode;
    return this;
  }

  public withMonthlyRecurringRevenue(
    monthlyRecurringRevenue: string,
  ): CreateOpportunityAdapterEventMother {
    this.body.monthlyRecurringRevenue = monthlyRecurringRevenue;
    return this;
  }

  public withTargetCloseDate(
    targetCloseDate: string,
  ): CreateOpportunityAdapterEventMother {
    this.body.targetCloseDate = targetCloseDate;
    return this;
  }

  public withCustomerCity(
    customerCity: string | undefined,
  ): CreateOpportunityAdapterEventMother {
    this.body.customerCity = customerCity;
    return this;
  }

  public withCustomerAddress(
    customerAddress: string | undefined,
  ): CreateOpportunityAdapterEventMother {
    this.body.customerAddress = customerAddress;
    return this;
  }

  public build(): APIGatewayProxyEvent {
    return APIGatewayProxyEventMother.basic()
      .withPathParameters(this.pathParameters)
      .withBody(JSON.stringify(this.body))
      .withUserClaims({
        sub: this.user.id,
        email: this.user.email,
      })
      .build();
  }
}
