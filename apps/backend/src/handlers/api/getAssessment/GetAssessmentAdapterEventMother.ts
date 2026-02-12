import type { APIGatewayProxyEvent } from 'aws-lambda';

import { type User, UserMother } from '@backend/models';
import type { operations } from '@shared/api-schema';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';

type GetAssessmentPathParameters = NonNullable<
  operations['getAssessment']['parameters']['path']
>;
type GetAssessmentQueryStringParameters = NonNullable<
  operations['getAssessment']['parameters']['query']
>;

export class GetAssessmentAdapterEventMother {
  private pathParameters: GetAssessmentPathParameters;
  private queryStringParameters: GetAssessmentQueryStringParameters;
  private user: Pick<User, 'id' | 'email'> = UserMother.basic().build();

  private constructor(
    queryStringParameters: GetAssessmentQueryStringParameters,
    pathParameters: GetAssessmentPathParameters,
  ) {
    this.pathParameters = pathParameters;
    this.queryStringParameters = queryStringParameters;
  }

  public static basic(): GetAssessmentAdapterEventMother {
    return new GetAssessmentAdapterEventMother(
      {},
      {
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      },
    );
  }

  public withVersion(version?: number): GetAssessmentAdapterEventMother {
    this.queryStringParameters.version = version;
    return this;
  }

  public withAssessmentId(
    assessmentId: string,
  ): GetAssessmentAdapterEventMother {
    this.pathParameters.assessmentId = assessmentId;
    return this;
  }

  public withUser(
    user: Pick<User, 'id' | 'email'>,
  ): GetAssessmentAdapterEventMother {
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
      .withPathParameters(this.pathParameters)
      .withQueryStringParameters(queryStringParameters)
      .withUserClaims({
        sub: this.user.id,
        email: this.user.email,
      })
      .build();
  }
}
