import { type User, UserMother } from '@backend/models';

import type { AddCommentUseCaseArgs } from './AddCommentUseCase';

export class AddCommentUseCaseArgsMother {
  private data: AddCommentUseCaseArgs;

  private constructor(data: AddCommentUseCaseArgs) {
    this.data = data;
  }

  public static basic(): AddCommentUseCaseArgsMother {
    return new AddCommentUseCaseArgsMother({
      assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      findingId: 'tool#1',
      text: 'This is a comment',
      user: UserMother.basic().build(),
    });
  }

  public withAssessmentId(assessmentId: string): AddCommentUseCaseArgsMother {
    this.data.assessmentId = assessmentId;
    return this;
  }

  public withFindingId(findingId: string): AddCommentUseCaseArgsMother {
    this.data.findingId = findingId;
    return this;
  }

  public withText(text: string): AddCommentUseCaseArgsMother {
    this.data.text = text;
    return this;
  }

  public withUser(user: User): AddCommentUseCaseArgsMother {
    this.data.user = user;
    return this;
  }

  public build(): AddCommentUseCaseArgs {
    return this.data;
  }
}
