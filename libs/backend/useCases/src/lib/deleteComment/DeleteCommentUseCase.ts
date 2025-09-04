import {
  tokenAssessmentsRepository,
  tokenLogger,
} from '@backend/infrastructure';
import type { User } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';

import {
  FindingCommentForbiddenError,
  FindingCommentNotFoundError,
  FindingNotFoundError,
} from '../../errors';

export type DeleteCommentUseCaseArgs = {
  assessmentId: string;
  findingId: string;
  commentId: string;
  user: User;
};

export interface DeleteCommentUseCase {
  deleteComment(args: DeleteCommentUseCaseArgs): Promise<void>;
}

export class DeleteCommentUseCaseImpl implements DeleteCommentUseCase {
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);
  private readonly logger = inject(tokenLogger);

  public async deleteComment(args: DeleteCommentUseCaseArgs): Promise<void> {
    const { assessmentId, findingId, commentId, user } = args;

    const finding = await this.assessmentsRepository.getFinding({
      assessmentId,
      organization: user.organizationDomain,
      findingId,
    });
    if (!finding) {
      throw new FindingNotFoundError({
        assessmentId,
        findingId,
        organization: user.organizationDomain,
      });
    }

    const comment = finding.comments?.find((c) => c.id === commentId);
    if (!comment) {
      throw new FindingCommentNotFoundError({
        assessmentId,
        findingId,
        organization: user.organizationDomain,
        commentId,
      });
    }
    if (comment.authorId !== user.id) {
      throw new FindingCommentForbiddenError({
        findingId,
        commentId,
        userEmail: user.email,
        actionType: 'delete',
      });
    }

    await this.assessmentsRepository.deleteFindingComment({
      assessmentId,
      organization: user.organizationDomain,
      findingId,
      commentId,
    });
  }
}

export const tokenDeleteCommentUseCase =
  createInjectionToken<DeleteCommentUseCase>('DeleteCommentUseCase', {
    useClass: DeleteCommentUseCaseImpl,
  });
