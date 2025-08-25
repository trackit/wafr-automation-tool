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
    const qs = Object.entries(this.data).reduce((acc, [key, value]) => {
      acc[key] = String(value);
      return acc;
    }, {} as APIGatewayProxyEventQueryStringParameters);
    return APIGatewayProxyEventMother.basic()
      .withQueryStringParameters(qs)
      .withUserClaims({
        sub: this.user.id,
        email: this.user.email,
      })
      .build();
  }
}
