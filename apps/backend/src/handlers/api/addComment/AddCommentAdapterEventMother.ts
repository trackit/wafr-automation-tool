import type { APIGatewayProxyEvent } from 'aws-lambda';

import { type User, UserMother } from '@backend/models';
import type { operations } from '@shared/api-schema';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';

type AddCommentParameters = NonNullable<
  operations['addComment']['parameters']['path']
>;

type AddCommentBody = NonNullable<
  operations['addComment']['requestBody']['content']['application/json']
>;

export class AddCommentAdapterEventMother {
  private pathParameters: AddCommentParameters;
  private body: AddCommentBody;
  private user: Pick<User, 'id' | 'email'> = UserMother.basic().build();

  private constructor(params: AddCommentParameters, body: AddCommentBody) {
    this.pathParameters = params;
    this.body = body;
  }

  public static basic(): AddCommentAdapterEventMother {
    return new AddCommentAdapterEventMother(
      {
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        findingId: 'finding-id',
      },
      {
        text: 'comment-text',
      },
    );
  }

  public withAssessmentId(assessmentId: string): AddCommentAdapterEventMother {
    this.pathParameters.assessmentId = assessmentId;
    return this;
  }

  public withFindingId(findingId: string): AddCommentAdapterEventMother {
    this.pathParameters.findingId = findingId;
    return this;
  }

  public withText(text: string): AddCommentAdapterEventMother {
    this.body.text = text;
    return this;
  }

  public withUser(
    user: Pick<User, 'id' | 'email'>,
  ): AddCommentAdapterEventMother {
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
