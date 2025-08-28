import type { User } from '@backend/models';
import type { DeleteCommentUseCaseArgs } from './DeleteCommentUseCase';

export class DeleteCommentUseCaseArgsMother {
  private data: DeleteCommentUseCaseArgs;

  private constructor(data: DeleteCommentUseCaseArgs) {
    this.data = data;
  }

  public static basic(): DeleteCommentUseCaseArgsMother {
    return new DeleteCommentUseCaseArgsMother({
      assessmentId: 'assessment-id',
      findingId: 'tool#1',
      commentId: 'comment-id',
      user: {
        id: 'user-id',
        organizationDomain: 'test.io',
        email: 'user-id@test.io',
      },
    });
  }

  public withAssessmentId(
    assessmentId: string
  ): DeleteCommentUseCaseArgsMother {
    this.data.assessmentId = assessmentId;
    return this;
  }

  public withFindingId(findingId: string): DeleteCommentUseCaseArgsMother {
    this.data.findingId = findingId;
    return this;
  }

  public withCommentId(commentId: string): DeleteCommentUseCaseArgsMother {
    this.data.commentId = commentId;
    return this;
  }

  public withUser(user: User): DeleteCommentUseCaseArgsMother {
    this.data.user = user;
    return this;
  }

  public build(): DeleteCommentUseCaseArgs {
    return this.data;
  }
}
