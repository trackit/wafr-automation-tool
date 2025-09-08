import type { APIGatewayProxyEvent } from 'aws-lambda';

import type { User } from '@backend/models';
import type { operations } from '@shared/api-schema';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';

export class UpdateQuestionAdapterEventMother {
  private path: operations['updateQuestion']['parameters']['path'];
  private body: operations['updateQuestion']['requestBody']['content']['application/json'];
  private user: Pick<User, 'id' | 'email'> = {
    id: 'user-id',
    email: 'user-id@test.io',
  };

  private constructor(
    path: operations['updateQuestion']['parameters']['path'],
    body: operations['updateQuestion']['requestBody']['content']['application/json']
  ) {
    this.path = path;
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
    this.path.assessmentId = assessmentId;
    return this;
  }

  public withPillarId(pillarId: string): UpdateQuestionAdapterEventMother {
    this.path.pillarId = pillarId;
    return this;
  }

  public withQuestionId(questionId: string): UpdateQuestionAdapterEventMother {
    this.path.questionId = questionId;
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
      .withPathParameters(this.path)
      .withBody(JSON.stringify(this.body))
      .withUserClaims({
        sub: this.user.id,
        email: this.user.email,
      })
      .build();
  }
}
