import type { APIGatewayProxyEvent } from 'aws-lambda';

import { type User, UserMother } from '@backend/models';
import type { operations } from '@shared/api-schema';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';

type UpdateCommentParameters = NonNullable<
  operations['updateComment']['parameters']['path']
>;

type UpdateCommentBody = NonNullable<
  operations['updateComment']['requestBody']['content']['application/json']
>;

export class UpdateCommentAdapterEventMother {
  private pathParameters: UpdateCommentParameters;
  private body: UpdateCommentBody;
  private user: Pick<User, 'id' | 'email'> = UserMother.basic().build();

  private constructor(
    params: UpdateCommentParameters,
    body: UpdateCommentBody,
  ) {
    this.pathParameters = params;
    this.body = body;
  }

  public static basic(): UpdateCommentAdapterEventMother {
    return new UpdateCommentAdapterEventMother(
      {
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        findingId: 'finding-id',
        commentId: '2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        version: '1',
      },
      {
        text: 'comment-text',
      },
    );
  }

  public withAssessmentId(
    assessmentId: string,
  ): UpdateCommentAdapterEventMother {
    this.pathParameters.assessmentId = assessmentId;
    return this;
  }

  public withFindingId(findingId: string): UpdateCommentAdapterEventMother {
    this.pathParameters.findingId = findingId;
    return this;
  }

  public withCommentId(commentId: string): UpdateCommentAdapterEventMother {
    this.pathParameters.commentId = commentId;
    return this;
  }

  public withVersion(version: string): UpdateCommentAdapterEventMother {
    this.pathParameters.version = version;
    return this;
  }

  public withText(text: string): UpdateCommentAdapterEventMother {
    this.body.text = text;
    return this;
  }

  public withUser(
    user: Pick<User, 'id' | 'email'>,
  ): UpdateCommentAdapterEventMother {
    this.user = user;
    return this;
  }

  public withBody(body: UpdateCommentBody): UpdateCommentAdapterEventMother {
    this.body = body;
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
