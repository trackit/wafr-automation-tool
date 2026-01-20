import {
  tokenAssessmentsRepository,
  tokenFindingsRepository,
  tokenLogger,
} from '@backend/infrastructure';
import type { User } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';

import {
  AssessmentNotFoundError,
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
  private readonly findingsRepository = inject(tokenFindingsRepository);
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);
  private readonly logger = inject(tokenLogger);

  public async deleteComment(args: DeleteCommentUseCaseArgs): Promise<void> {
    const { assessmentId, findingId, commentId, user } = args;
    const assessment = await this.assessmentsRepository.get({
      assessmentId,
      organizationDomain: user.organizationDomain,
    });
    if (!assessment) {
      throw new AssessmentNotFoundError({
        assessmentId,
        organizationDomain: user.organizationDomain,
      });
    }
    const version = assessment.latestVersionNumber;
    const finding = await this.findingsRepository.get({
      assessmentId,
      organizationDomain: user.organizationDomain,
      version,
      findingId,
    });
    if (!finding) {
      throw new FindingNotFoundError({
        assessmentId,
        findingId,
        organizationDomain: user.organizationDomain,
      });
    }

    const comment = finding.comments?.find((c) => c.id === commentId);
    if (!comment) {
      throw new FindingCommentNotFoundError({
        assessmentId,
        findingId,
        organizationDomain: user.organizationDomain,
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

    await this.findingsRepository.deleteComment({
      assessmentId,
      organizationDomain: user.organizationDomain,
      version,
      findingId,
      commentId,
    });
    this.logger.info(
      `Delete comment for finding ${findingId} in assessment ${assessmentId} by user ${user.id}`,
    );
  }
}

export const tokenDeleteCommentUseCase =
  createInjectionToken<DeleteCommentUseCase>('DeleteCommentUseCase', {
    useClass: DeleteCommentUseCaseImpl,
  });
