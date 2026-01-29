import type { APIGatewayProxyEvent } from 'aws-lambda';

import { type User, UserMother } from '@backend/models';
import type { operations } from '@shared/api-schema';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';

type GetAssessmentGraphParameters =
  operations['getAssessmentGraph']['parameters']['path'];
type GetAssessmentQueryStringParameters = NonNullable<
  operations['getAssessment']['parameters']['query']
>;
export class GetAssessmentGraphAdapterEventMother {
  private pathParameters: GetAssessmentGraphParameters;
  private queryStringParameters: GetAssessmentQueryStringParameters;
  private user: Pick<User, 'id' | 'email'> = UserMother.basic().build();

  private constructor(
    queryStringParameters: GetAssessmentQueryStringParameters,
    pathParams: GetAssessmentGraphParameters,
  ) {
    this.queryStringParameters = queryStringParameters;
    this.pathParameters = pathParams;
  }

  public static basic(): GetAssessmentGraphAdapterEventMother {
    return new GetAssessmentGraphAdapterEventMother(
      {},
      {
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      },
    );
  }

  public withVersion(version?: number): GetAssessmentGraphAdapterEventMother {
    this.queryStringParameters.version = version;
    return this;
  }

  public withAssessmentId(
    assessmentId: string,
  ): GetAssessmentGraphAdapterEventMother {
    this.pathParameters.assessmentId = assessmentId;
    return this;
  }

  public withUser(
    user: Pick<User, 'id' | 'email'>,
  ): GetAssessmentGraphAdapterEventMother {
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
