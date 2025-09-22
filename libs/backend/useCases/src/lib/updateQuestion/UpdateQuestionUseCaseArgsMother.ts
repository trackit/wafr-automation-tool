import { type User, UserMother } from '@backend/models';

import type { UpdateQuestionUseCaseArgs } from './UpdateQuestionUseCase';

export class UpdateQuestionUseCaseArgsMother {
  private data: UpdateQuestionUseCaseArgs;

  private constructor(data: UpdateQuestionUseCaseArgs) {
    this.data = data;
  }

  public static basic(): UpdateQuestionUseCaseArgsMother {
    return new UpdateQuestionUseCaseArgsMother({
      assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      pillarId: 'pillar-id',
      questionId: 'question-id',
      user: UserMother.basic().build(),
      questionBody: {
        disabled: false,
        none: false,
      },
    });
  }

  public withAssessmentId(
    assessmentId: string
  ): UpdateQuestionUseCaseArgsMother {
    this.data.assessmentId = assessmentId;
    return this;
  }

  public withPillarId(pillarId: string): UpdateQuestionUseCaseArgsMother {
    this.data.pillarId = pillarId;
    return this;
  }

  public withQuestionId(questionId: string): UpdateQuestionUseCaseArgsMother {
    this.data.questionId = questionId;
    return this;
  }

  public withUser(user: User): UpdateQuestionUseCaseArgsMother {
    this.data.user = user;
    return this;
  }

  public withDisabled(disabled?: boolean): UpdateQuestionUseCaseArgsMother {
    this.data.questionBody = {
      ...this.data.questionBody,
      disabled,
    };
    return this;
  }

  public withNone(none?: boolean): UpdateQuestionUseCaseArgsMother {
    this.data.questionBody = {
      ...this.data.questionBody,
      none,
    };
    return this;
  }

  public build(): UpdateQuestionUseCaseArgs {
    return this.data;
  }
}
