import type { APIGatewayProxyEvent } from 'aws-lambda';

import { type User, UserMother } from '@backend/models';
import type { operations } from '@shared/api-schema';

import { APIGatewayProxyEventMother } from '../../../utils/api/APIGatewayProxyEventMother';

type UpdateBestPracticePathParameters =
  operations['updateBestPractice']['parameters']['path'];
type UpdateBestPracticeBody =
  operations['updateBestPractice']['requestBody']['content']['application/json'];

export class UpdateBestPracticeAdapterEventMother {
  private pathParameters: UpdateBestPracticePathParameters;
  private body: UpdateBestPracticeBody;
  private user: Pick<User, 'id' | 'email'> = UserMother.basic().build();

  private constructor(
    pathParameters: UpdateBestPracticePathParameters,
    body: UpdateBestPracticeBody
  ) {
    this.pathParameters = pathParameters;
    this.body = body;
  }

  public static basic(): UpdateBestPracticeAdapterEventMother {
    return new UpdateBestPracticeAdapterEventMother(
      {
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        pillarId: '1',
        questionId: '1',
        bestPracticeId: '1',
      },
      {
        checked: true,
      }
    );
  }

  public withAssessmentId(
    assessmentId: string
  ): UpdateBestPracticeAdapterEventMother {
    this.pathParameters.assessmentId = assessmentId;
    return this;
  }

  public withPillarId(pillarId: string): UpdateBestPracticeAdapterEventMother {
    this.pathParameters.pillarId = pillarId;
    return this;
  }

  public withQuestionId(
    questionId: string
  ): UpdateBestPracticeAdapterEventMother {
    this.pathParameters.questionId = questionId;
    return this;
  }

  public withBestPracticeId(
    bestPracticeId: string
  ): UpdateBestPracticeAdapterEventMother {
    this.pathParameters.bestPracticeId = bestPracticeId;
    return this;
  }

  public withBody(
    body: UpdateBestPracticeBody
  ): UpdateBestPracticeAdapterEventMother {
    this.body = body;
    return this;
  }

  public withUser(
    user: Pick<User, 'id' | 'email'>
  ): UpdateBestPracticeAdapterEventMother {
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
