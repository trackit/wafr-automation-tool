import {
  tokenAssessmentsRepository,
  tokenLogger,
} from '@backend/infrastructure';
import type { User } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';
import { ForbiddenError, NotFoundError } from '../Errors';

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
      this.logger.error(
        `Finding with findingId ${findingId} not found for assessment ${assessmentId} in organization ${user.organizationDomain}`
      );
      throw new NotFoundError(
        `Finding with findingId ${findingId} not found for assessment ${assessmentId} in organization ${user.organizationDomain}`
      );
    }

    if (!finding.comments || !(commentId in finding.comments)) {
      this.logger.error(
        `Comment with commentId ${commentId} not found for finding ${findingId} in assessment ${assessmentId} in organization ${user.organizationDomain}`
      );
      throw new NotFoundError(
        `Comment with commentId ${commentId} not found for finding ${findingId} in assessment ${assessmentId} in organization ${user.organizationDomain}`
      );
    }

    const comment = finding.comments[commentId];
    if (comment.author !== user.email) {
      throw new ForbiddenError(
        `User ${user.email} is not allowed to delete comment ${commentId} for finding ${findingId}`
      );
    }

    await this.assessmentsRepository
      .deleteFindingComment({
        assessmentId,
        organization: user.organizationDomain,
        finding,
        commentId,
      })
      .catch((error) => {
        throw error;
      });
  }
}

export const tokenDeleteCommentUseCase =
  createInjectionToken<DeleteCommentUseCase>('DeleteCommentUseCase', {
    useClass: DeleteCommentUseCaseImpl,
  });
