import type { APIGatewayProxyEvent } from 'aws-lambda';

import type { User } from '@backend/models';
import type { operations } from '@shared/api-schema';

import { APIGatewayProxyEventMother } from '../../utils/APIGatewayProxyEventMother';

export class UpdateBestPracticeAdapterEventMother {
  private path: operations['updateBestPractice']['parameters']['path'];
  private body: operations['updateBestPractice']['requestBody']['content']['application/json'];
  private user: Pick<User, 'id' | 'email'> = {
    id: 'user-id',
    email: 'user-id@test.io',
  };

  private constructor(
    path: operations['updateBestPractice']['parameters']['path'],
    body: operations['updateBestPractice']['requestBody']['content']['application/json']
  ) {
    this.path = path;
    this.body = body;
  }

  public static basic(): UpdateBestPracticeAdapterEventMother {
    return new UpdateBestPracticeAdapterEventMother(
      {
        assessmentId: 'assessment-id',
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
    assessmentId: operations['updateBestPractice']['parameters']['path']['assessmentId']
  ): UpdateBestPracticeAdapterEventMother {
    this.path.assessmentId = assessmentId;
    return this;
  }

  public withPillarId(
    pillarId: operations['updateBestPractice']['parameters']['path']['pillarId']
  ): UpdateBestPracticeAdapterEventMother {
    this.path.pillarId = pillarId;
    return this;
  }

  public withQuestionId(
    questionId: operations['updateBestPractice']['parameters']['path']['questionId']
  ): UpdateBestPracticeAdapterEventMother {
    this.path.questionId = questionId;
    return this;
  }

  public withBestPracticeId(
    bestPracticeId: operations['updateBestPractice']['parameters']['path']['bestPracticeId']
  ): UpdateBestPracticeAdapterEventMother {
    this.path.bestPracticeId = bestPracticeId;
    return this;
  }

  public withBody(
    body: operations['updateBestPractice']['requestBody']['content']['application/json']
  ): UpdateBestPracticeAdapterEventMother {
    this.body = body;
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
