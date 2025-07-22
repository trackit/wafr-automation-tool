import type {
  APIGatewayProxyEvent,
  APIGatewayProxyEventQueryStringParameters,
} from 'aws-lambda';

import type { User } from '@backend/models';
import type { operations } from '@shared/api-schema';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';

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
    nextToken: GetAllAssessmentsQuery['nextToken']
  ): GetAllAssessmentsAdapterEventMother {
    this.data.nextToken = nextToken;
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
