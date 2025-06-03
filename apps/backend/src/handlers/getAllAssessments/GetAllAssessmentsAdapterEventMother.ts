import type {
  APIGatewayProxyEvent,
  APIGatewayProxyEventQueryStringParameters,
} from 'aws-lambda';

import type { User } from '@backend/models';
import type { operations } from '@shared/api-schema';

import { APIGatewayProxyEventMother } from '../../utils/APIGatewayProxyEventMother';

type GetAllAssessmentsQuery = NonNullable<
  operations['getAssessments']['parameters']['query']
>;

export class GetAllAssessmentsAdapterEventMother {
  private data: GetAllAssessmentsQuery;
  private user: Pick<User, 'id' | 'email'> = {
    id: 'user-id',
    email: 'user-id@test.io',
  };

  private constructor(data: GetAllAssessmentsQuery) {
    this.data = data;
  }

  public static basic(): GetAllAssessmentsAdapterEventMother {
    return new GetAllAssessmentsAdapterEventMother({});
  }

  public withLimit(
    limit: GetAllAssessmentsQuery['limit']
  ): GetAllAssessmentsAdapterEventMother {
    this.data.limit = limit;
    return this;
  }

  public withNextToken(
    nextToken: GetAllAssessmentsQuery['next_token']
  ): GetAllAssessmentsAdapterEventMother {
    this.data.next_token = nextToken;
    return this;
  }

  public withSearch(
    search: GetAllAssessmentsQuery['search']
  ): GetAllAssessmentsAdapterEventMother {
    this.data.search = search;
    return this;
  }

  public withUser(
    user: Pick<User, 'id' | 'email'>
  ): GetAllAssessmentsAdapterEventMother {
    this.user = user;
    return this;
  }

  public build(): APIGatewayProxyEvent {
    const qsEntries = Object.entries(this.data).map(([key, value]) => [
      key,
      String(value),
    ]);
    const qs = Object.fromEntries(
      qsEntries
    ) as APIGatewayProxyEventQueryStringParameters;
    return APIGatewayProxyEventMother.basic()
      .withQueryStringParameters(qs)
      .withUserClaims({
        sub: this.user.id,
        email: this.user.email,
      })
      .build();
  }
}
