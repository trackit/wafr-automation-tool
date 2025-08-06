import {
  tokenAssessmentsRepository,
  tokenLogger,
} from '@backend/infrastructure';
import type { FindingCommentBody, User } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';
import { ForbiddenError, NotFoundError } from '../Errors';

export type UpdateCommentUseCaseArgs = {
  assessmentId: string;
  findingId: string;
  commentId: string;
  user: User;
  commentBody: FindingCommentBody;
};

export interface UpdateCommentUseCase {
  updateComment(args: UpdateCommentUseCaseArgs): Promise<void>;
}

export class UpdateCommentUseCaseImpl implements UpdateCommentUseCase {
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);
  private readonly logger = inject(tokenLogger);

  public async updateComment(args: UpdateCommentUseCaseArgs): Promise<void> {
    const { assessmentId, findingId, commentId, user, commentBody } = args;

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
        `User ${user.email} is not allowed to update comment ${commentId} for finding ${findingId}`
      );
    }

    await this.assessmentsRepository
      .updateFindingComment({
        assessmentId,
        organization: user.organizationDomain,
        findingId,
        commentId,
        commentBody,
      })
      .catch((error) => {
        throw error;
      });
  }
}

export const tokenUpdateCommentUseCase =
  createInjectionToken<UpdateCommentUseCase>('UpdateCommentUseCase', {
    useClass: UpdateCommentUseCaseImpl,
  });
