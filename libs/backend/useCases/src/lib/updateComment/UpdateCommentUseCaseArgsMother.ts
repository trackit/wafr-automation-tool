import {
  type FindingCommentBody,
  type User,
  UserMother,
} from '@backend/models';

import type { UpdateCommentUseCaseArgs } from './UpdateCommentUseCase';

export class UpdateCommentUseCaseArgsMother {
  private data: UpdateCommentUseCaseArgs;

  private constructor(data: UpdateCommentUseCaseArgs) {
    this.data = data;
  }

  public static basic(): UpdateCommentUseCaseArgsMother {
    return new UpdateCommentUseCaseArgsMother({
      assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      findingId: 'tool#1',
      commentId: '2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      commentBody: {
        text: 'comment-text',
      },
      user: UserMother.basic().build(),
    });
  }

  public withAssessmentId(
    assessmentId: string
  ): UpdateCommentUseCaseArgsMother {
    this.data.assessmentId = assessmentId;
    return this;
  }

  public withFindingId(findingId: string): UpdateCommentUseCaseArgsMother {
    this.data.findingId = findingId;
    return this;
  }

  public withCommentId(commentId: string): UpdateCommentUseCaseArgsMother {
    this.data.commentId = commentId;
    return this;
  }

  public withCommentBody(
    commentBody: FindingCommentBody
  ): UpdateCommentUseCaseArgsMother {
    this.data.commentBody = commentBody;
    return this;
  }

  public withUser(user: User): UpdateCommentUseCaseArgsMother {
    this.data.user = user;
    return this;
  }

  public build(): UpdateCommentUseCaseArgs {
    return this.data;
  }
}
