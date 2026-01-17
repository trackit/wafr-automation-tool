import type { APIGatewayProxyEvent } from 'aws-lambda';

import { type User, UserMother } from '@backend/models';
import type { operations } from '@shared/api-schema';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';

type DeleteFolderPathParameters =
  operations['deleteFolder']['parameters']['path'];

export class DeleteFolderAdapterEventMother {
  private pathParameters: DeleteFolderPathParameters;
  private user: Pick<User, 'id' | 'email'> = UserMother.basic().build();

  private constructor(pathParameters: DeleteFolderPathParameters) {
    this.pathParameters = pathParameters;
  }

  public static basic(): DeleteFolderAdapterEventMother {
    return new DeleteFolderAdapterEventMother({
      folderName: 'Test Folder',
    });
  }

  public withFolderName(folderName: string): DeleteFolderAdapterEventMother {
    this.pathParameters.folderName = folderName;
    return this;
  }

  public withUser(
    user: Pick<User, 'id' | 'email'>,
  ): DeleteFolderAdapterEventMother {
    this.user = user;
    return this;
  }

  public build(): APIGatewayProxyEvent {
    return APIGatewayProxyEventMother.basic()
      .withPathParameters(this.pathParameters)
      .withUserClaims({
        sub: this.user.id,
        email: this.user.email,
      })
      .build();
  }
}
