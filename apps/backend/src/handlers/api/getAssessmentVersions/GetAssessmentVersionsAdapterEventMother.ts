import type { APIGatewayProxyEvent } from 'aws-lambda';

import { type User, UserMother } from '@backend/models';
import type { operations } from '@shared/api-schema';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';

type GetAssessmentVersionsPathParameters =
  operations['getAssessmentVersions']['parameters']['path'];
type GetAssessmentVersionsQueryStringParameters = NonNullable<
  operations['getAssessmentVersions']['parameters']['query']
>;

export class GetAssessmentVersionsAdapterEventMother {
  private pathParameters: GetAssessmentVersionsPathParameters;
  private queryStringParameters: GetAssessmentVersionsQueryStringParameters;
  private user: Pick<User, 'id' | 'email'> = UserMother.basic().build();

  private constructor(
    pathParameters: GetAssessmentVersionsPathParameters,
    queryStringParameters: GetAssessmentVersionsQueryStringParameters,
  ) {
    this.pathParameters = pathParameters;
    this.queryStringParameters = queryStringParameters;
  }

  public static basic(): GetAssessmentVersionsAdapterEventMother {
    return new GetAssessmentVersionsAdapterEventMother(
      {
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      },
      {},
    );
  }

  public withAssessmentId(
    assessmentId: string,
  ): GetAssessmentVersionsAdapterEventMother {
    this.pathParameters.assessmentId = assessmentId;
    return this;
  }

  public withOrganizationDomain(
    organizationDomain: string,
  ): GetAssessmentVersionsAdapterEventMother {
    this.user.email = `${this.user.id}@${organizationDomain}`;
    return this;
  }

  public withLimit(limit?: number): GetAssessmentVersionsAdapterEventMother {
    this.queryStringParameters.limit = limit;
    return this;
  }

  public withNextToken(
    nextToken?: string,
  ): GetAssessmentVersionsAdapterEventMother {
    this.queryStringParameters.nextToken = nextToken;
    return this;
  }

  public withUser(
    user: Pick<User, 'id' | 'email'>,
  ): GetAssessmentVersionsAdapterEventMother {
    this.user = user;
    return this;
  }

  public build(): APIGatewayProxyEvent {
    const queryStringParameters = Object.fromEntries(
      Object.entries(this.queryStringParameters).map(([key, value]) => [
        key,
        value === undefined ? undefined : String(value),
      ]),
    );
    return APIGatewayProxyEventMother.basic()
      .withUserClaims({ sub: this.user.id, email: this.user.email })
      .withPathParameters(this.pathParameters)
      .withQueryStringParameters(queryStringParameters)
      .build();
  }
}
