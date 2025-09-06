import {
  tokenAssessmentsRepository,
  tokenIdGenerator,
  tokenLogger,
} from '@backend/infrastructure';
import type { FindingComment, User } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';

import { FindingNotFoundError } from '../../errors';

export type AddCommentUseCaseArgs = {
  assessmentId: string;
  findingId: string;
  text: string;
  user: User;
};

export interface AddCommentUseCase {
  addComment(args: AddCommentUseCaseArgs): Promise<FindingComment>;
}

export class AddCommentUseCaseImpl implements AddCommentUseCase {
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);
  private readonly idGenerator = inject(tokenIdGenerator);
  private readonly logger = inject(tokenLogger);

  public async addComment(
    args: AddCommentUseCaseArgs
  ): Promise<FindingComment> {
    const { assessmentId, findingId, text, user } = args;

    const finding = await this.assessmentsRepository.getFinding({
      assessmentId,
      organization: user.organizationDomain,
      findingId,
    });
    if (!finding) {
      throw new FindingNotFoundError({
        assessmentId,
        organization: user.organizationDomain,
        findingId,
      });
    }

    const comment: FindingComment = {
      id: this.idGenerator.generate(),
      authorId: user.id,
      text,
      createdAt: new Date(),
    };
    await this.assessmentsRepository.addFindingComment({
      assessmentId,
      organization: user.organizationDomain,
      findingId,
      comment,
    });
    this.logger.info(
      `User ${user.id} added comment ${comment.id} to finding ${findingId} in assessment ${assessmentId}`
    );
    return comment;
  }
}

export const tokenAddCommentUseCase = createInjectionToken<AddCommentUseCase>(
  'AddCommentUseCase',
  {
    useClass: AddCommentUseCaseImpl,
  }
);
