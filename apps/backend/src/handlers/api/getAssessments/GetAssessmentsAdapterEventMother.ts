import type { APIGatewayProxyEvent } from 'aws-lambda';

import { type User, UserMother } from '@backend/models';
import type { operations } from '@shared/api-schema';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';

type GetAssessmentsQueryStringParameters = NonNullable<
  operations['getAssessments']['parameters']['query']
>;

export class GetAssessmentsAdapterEventMother {
  private queryStringParameters: GetAssessmentsQueryStringParameters;
  private user: Pick<User, 'id' | 'email'> = UserMother.basic().build();

  private constructor(
    queryStringParameters: GetAssessmentsQueryStringParameters
  ) {
    this.queryStringParameters = queryStringParameters;
  }

  public static basic(): GetAssessmentsAdapterEventMother {
    return new GetAssessmentsAdapterEventMother({});
  }

  public withLimit(limit?: number): GetAssessmentsAdapterEventMother {
    this.queryStringParameters.limit = limit;
    return this;
  }

  public withNextToken(nextToken?: string): GetAssessmentsAdapterEventMother {
    this.queryStringParameters.nextToken = nextToken;
    return this;
  }

  public withSearch(search?: string): GetAssessmentsAdapterEventMother {
    this.queryStringParameters.search = search;
    return this;
  }

  public withUser(
    user: Pick<User, 'id' | 'email'>
  ): GetAssessmentsAdapterEventMother {
    this.user = user;
    return this;
  }

  public build(): APIGatewayProxyEvent {
    const queryStringParameters = Object.fromEntries(
      Object.entries(this.queryStringParameters).map(([key, value]) => [
        key,
        value === undefined ? undefined : String(value),
      ])
    );
    return APIGatewayProxyEventMother.basic()
      .withQueryStringParameters(queryStringParameters)
      .withUserClaims({
        sub: this.user.id,
        email: this.user.email,
      })
      .build();
  }
}
