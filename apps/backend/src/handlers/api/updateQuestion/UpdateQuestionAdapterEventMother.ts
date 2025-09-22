import type { APIGatewayProxyEvent } from 'aws-lambda';

import { type User, UserMother } from '@backend/models';
import type { operations } from '@shared/api-schema';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';

type UpdateQuestionPathParameters =
  operations['updateQuestion']['parameters']['path'];
type UpdateQuestionBody =
  operations['updateQuestion']['requestBody']['content']['application/json'];

export class UpdateQuestionAdapterEventMother {
  private pathParameters: UpdateQuestionPathParameters;
  private body: UpdateQuestionBody;
  private user: Pick<User, 'id' | 'email'> = UserMother.basic().build();

  private constructor(
    pathParameters: UpdateQuestionPathParameters,
    body: UpdateQuestionBody
  ) {
    this.pathParameters = pathParameters;
    this.body = body;
  }

  public static basic(): UpdateQuestionAdapterEventMother {
    return new UpdateQuestionAdapterEventMother(
      {
        assessmentId: '14270881-e4b0-4f89-8941-449eed22071d',
        pillarId: '1',
        questionId: '1',
      },
      {
        disabled: false,
        none: false,
      }
    );
  }

  public withAssessmentId(
    assessmentId: string
  ): UpdateQuestionAdapterEventMother {
    this.pathParameters.assessmentId = assessmentId;
    return this;
  }

  public withPillarId(pillarId: string): UpdateQuestionAdapterEventMother {
    this.pathParameters.pillarId = pillarId;
    return this;
  }

  public withQuestionId(questionId: string): UpdateQuestionAdapterEventMother {
    this.pathParameters.questionId = questionId;
    return this;
  }

  public withNone(none?: boolean): UpdateQuestionAdapterEventMother {
    this.body.none = none;
    return this;
  }

  public withDisabled(disabled?: boolean): UpdateQuestionAdapterEventMother {
    this.body.disabled = disabled;
    return this;
  }

  public withUser(
    user: Pick<User, 'id' | 'email'>
  ): UpdateQuestionAdapterEventMother {
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
