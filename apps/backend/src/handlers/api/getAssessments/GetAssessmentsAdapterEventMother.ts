import type {
  APIGatewayProxyEvent,
  APIGatewayProxyEventQueryStringParameters,
} from 'aws-lambda';

import type { User } from '@backend/models';
import type { operations } from '@shared/api-schema';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';

type GetAssessmentsQuery = NonNullable<
  operations['getAssessments']['parameters']['query']
>;

export class GetAssessmentsAdapterEventMother {
  private data: GetAssessmentsQuery;
  private user: Pick<User, 'id' | 'email'> = {
    id: 'user-id',
    email: 'user-id@test.io',
  };

  private constructor(data: GetAssessmentsQuery) {
    this.data = data;
  }

  public static basic(): GetAssessmentsAdapterEventMother {
    return new GetAssessmentsAdapterEventMother({});
  }

  public withLimit(
    limit: GetAssessmentsQuery['limit']
  ): GetAssessmentsAdapterEventMother {
    this.data.limit = limit;
    return this;
  }

  public withNextToken(
    nextToken: GetAssessmentsQuery['nextToken']
  ): GetAssessmentsAdapterEventMother {
    this.data.nextToken = nextToken;
    return this;
  }

  public withSearch(
    search: GetAssessmentsQuery['search']
  ): GetAssessmentsAdapterEventMother {
    this.data.search = search;
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
      Object.entries(this.data).map(([key, value]) => [
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
