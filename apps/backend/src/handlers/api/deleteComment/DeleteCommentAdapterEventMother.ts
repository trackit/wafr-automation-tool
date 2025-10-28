import type { APIGatewayProxyEvent } from 'aws-lambda';

import { type User, UserMother } from '@backend/models';
import type { operations } from '@shared/api-schema';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';

type DeleteCommentParameters = NonNullable<
  operations['deleteComment']['parameters']['path']
>;

export class DeleteCommentAdapterEventMother {
  private pathParameters: DeleteCommentParameters;
  private user: Pick<User, 'id' | 'email'> = UserMother.basic().build();

  private constructor(params: DeleteCommentParameters) {
    this.pathParameters = params;
  }

  public static basic(): DeleteCommentAdapterEventMother {
    return new DeleteCommentAdapterEventMother({
      assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      findingId: 'finding-id',
      commentId: '2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
    });
  }

  public withAssessmentId(
    assessmentId: string,
  ): DeleteCommentAdapterEventMother {
    this.pathParameters.assessmentId = assessmentId;
    return this;
  }

  public withFindingId(findingId: string): DeleteCommentAdapterEventMother {
    this.pathParameters.findingId = findingId;
    return this;
  }

  public withCommentId(commentId: string): DeleteCommentAdapterEventMother {
    this.pathParameters.commentId = commentId;
    return this;
  }

  public withUser(
    user: Pick<User, 'id' | 'email'>,
  ): DeleteCommentAdapterEventMother {
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
