import type { APIGatewayProxyEvent } from 'aws-lambda';

import { type User, UserMother } from '@backend/models';
import type { operations } from '@shared/api-schema';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';

type UpdateFolderPathParameters =
  operations['updateFolder']['parameters']['path'];
type UpdateFolderBody =
  operations['updateFolder']['requestBody']['content']['application/json'];

export class UpdateFolderAdapterEventMother {
  private pathParameters: UpdateFolderPathParameters;
  private body: UpdateFolderBody;
  private user: Pick<User, 'id' | 'email'> = UserMother.basic().build();

  private constructor(
    pathParameters: UpdateFolderPathParameters,
    body: UpdateFolderBody,
  ) {
    this.pathParameters = pathParameters;
    this.body = body;
  }

  public static basic(): UpdateFolderAdapterEventMother {
    return new UpdateFolderAdapterEventMother(
      { folderName: 'Old Folder' },
      { name: 'New Folder' },
    );
  }

  public withFolderName(folderName: string): UpdateFolderAdapterEventMother {
    this.pathParameters.folderName = folderName;
    return this;
  }

  public withNewName(name: string): UpdateFolderAdapterEventMother {
    this.body.name = name;
    return this;
  }

  public withUser(
    user: Pick<User, 'id' | 'email'>,
  ): UpdateFolderAdapterEventMother {
    this.user = user;
    return this;
  }

  public build(): APIGatewayProxyEvent {
    return APIGatewayProxyEventMother.basic()
      .withPathParameters(this.pathParameters)
      .withBody(JSON.stringify(this.body))
      .withUserClaims({
        sub: this.user.id,
        email: this.user.email,
      })
      .build();
  }
}
