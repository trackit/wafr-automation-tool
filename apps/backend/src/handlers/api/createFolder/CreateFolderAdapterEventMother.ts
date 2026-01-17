import type { APIGatewayProxyEvent } from 'aws-lambda';

import { type User, UserMother } from '@backend/models';
import type { operations } from '@shared/api-schema';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';

type CreateFolderBody =
  operations['createFolder']['requestBody']['content']['application/json'];

export class CreateFolderAdapterEventMother {
  private body: CreateFolderBody;
  private user: Pick<User, 'id' | 'email'> = UserMother.basic().build();

  private constructor(body: CreateFolderBody) {
    this.body = body;
  }

  public static basic(): CreateFolderAdapterEventMother {
    return new CreateFolderAdapterEventMother({
      name: 'Test Folder',
    });
  }

  public withName(name: string): CreateFolderAdapterEventMother {
    this.body.name = name;
    return this;
  }

  public withUser(
    user: Pick<User, 'id' | 'email'>,
  ): CreateFolderAdapterEventMother {
    this.user = user;
    return this;
  }

  public build(): APIGatewayProxyEvent {
    return APIGatewayProxyEventMother.basic()
      .withBody(JSON.stringify(this.body))
      .withUserClaims({
        sub: this.user.id,
        email: this.user.email,
      })
      .build();
  }
}
