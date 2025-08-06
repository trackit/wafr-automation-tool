import type { FindingCommentBody, User } from '@backend/models';
import type { UpdateCommentUseCaseArgs } from './UpdateCommentUseCase';

export class UpdateCommentUseCaseArgsMother {
  private data: UpdateCommentUseCaseArgs;

  private constructor(data: UpdateCommentUseCaseArgs) {
    this.data = data;
  }

  public static basic(): UpdateCommentUseCaseArgsMother {
    return new UpdateCommentUseCaseArgsMother({
      assessmentId: 'assessment-id',
      findingId: 'tool#1',
      commentId: 'comment-id',
      commentBody: {
        text: 'comment-text',
      },
      user: {
        id: 'user-id',
        organizationDomain: 'test.io',
        email: 'user-id@test.io',
      },
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
