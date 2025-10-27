import { APIGatewayProxyEvent } from 'aws-lambda';

import { type User, UserMother } from '@backend/models';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';

export class GetOrganizationAdapterEventMother {
  private user: Pick<User, 'id' | 'email'> = UserMother.basic().build();

  public static basic(): GetOrganizationAdapterEventMother {
    return new GetOrganizationAdapterEventMother();
  }

  public withUser(
    user: Pick<User, 'id' | 'email'>,
  ): GetOrganizationAdapterEventMother {
    this.user = user;
    return this;
  }

  public build(): APIGatewayProxyEvent {
    return APIGatewayProxyEventMother.basic()
      .withUserClaims({
        sub: this.user.id,
        email: this.user.email,
      })
      .build();
  }
}
