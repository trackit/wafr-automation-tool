import {
  tokenAssessmentsRepository,
  tokenFindingsRepository,
} from '@backend/infrastructure';
import type { FindingCommentBody, User } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';

import {
  AssessmentNotFoundError,
  FindingCommentForbiddenError,
  FindingCommentNotFoundError,
  FindingNotFoundError,
} from '../../errors';

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
  private readonly findingsRepository = inject(tokenFindingsRepository);
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);
  public async updateComment(args: UpdateCommentUseCaseArgs): Promise<void> {
    const { assessmentId, findingId, commentId, user, commentBody } = args;
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
        actionType: 'update',
      });
    }

    await this.findingsRepository.updateComment({
      assessmentId,
      organizationDomain: user.organizationDomain,
      version,
      findingId,
      commentId,
      commentBody,
    });
  }
}

export const tokenUpdateCommentUseCase =
  createInjectionToken<UpdateCommentUseCase>('UpdateCommentUseCase', {
    useClass: UpdateCommentUseCaseImpl,
  });
