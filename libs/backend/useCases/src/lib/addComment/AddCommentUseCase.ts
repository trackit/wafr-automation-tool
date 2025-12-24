import {
  tokenFindingsRepository,
  tokenIdGenerator,
  tokenLogger,
} from '@backend/infrastructure';
import type { FindingComment, User } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';

import { FindingNotFoundError } from '../../errors';

export type AddCommentUseCaseArgs = {
  assessmentId: string;
  findingId: string;
  version: number;
  text: string;
  user: User;
};

export interface AddCommentUseCase {
  addComment(args: AddCommentUseCaseArgs): Promise<FindingComment>;
}

export class AddCommentUseCaseImpl implements AddCommentUseCase {
  private readonly findingsRepository = inject(tokenFindingsRepository);
  private readonly idGenerator = inject(tokenIdGenerator);
  private readonly logger = inject(tokenLogger);

  public async addComment(
    args: AddCommentUseCaseArgs,
  ): Promise<FindingComment> {
    const { assessmentId, findingId, version, text, user } = args;
    const { organizationDomain } = user;

    const finding = await this.findingsRepository.get({
      assessmentId,
      organizationDomain,
      version,
      findingId,
    });
    if (!finding) {
      throw new FindingNotFoundError({
        assessmentId,
        organizationDomain,
        findingId,
      });
    }

    // Backward compatibility: if finding has no comments field, create an empty object
    if (!finding.comments) {
      await this.findingsRepository.update({
        assessmentId,
        organizationDomain,
        version,
        findingId,
        findingBody: {
          comments: [],
        },
      });
    }

    const comment: FindingComment = {
      id: this.idGenerator.generate(),
      authorId: user.id,
      text,
      createdAt: new Date(),
    };
    await this.findingsRepository.saveComment({
      assessmentId,
      organizationDomain,
      version,
      findingId,
      comment,
    });
    this.logger.info(
      `User ${user.id} added comment ${comment.id} to finding ${findingId} in assessment ${assessmentId}`,
    );
    return comment;
  }
}

export const tokenAddCommentUseCase = createInjectionToken<AddCommentUseCase>(
  'AddCommentUseCase',
  {
    useClass: AddCommentUseCaseImpl,
  },
);
