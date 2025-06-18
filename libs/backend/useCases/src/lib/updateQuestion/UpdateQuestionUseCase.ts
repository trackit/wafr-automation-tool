import {
  AssessmentNotFoundError,
  EmptyUpdateBodyError,
  PillarNotFoundError,
  QuestionNotFoundError,
  tokenAssessmentsRepository,
  tokenLogger,
} from '@backend/infrastructure';
import type { QuestionBody, User } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';
import { NoContentError, NotFoundError } from '../Errors';

export type UpdateQuestionUseCaseArgs = {
  assessmentId: string;
  pillarId: string;
  questionId: string;
  user: User;
  questionBody: QuestionBody;
};

export interface UpdateQuestionUseCase {
  updateQuestion(args: UpdateQuestionUseCaseArgs): Promise<void>;
}

export class UpdateQuestionUseCaseImpl implements UpdateQuestionUseCase {
  private readonly assessmentsRepository = inject(tokenAssessmentsRepository);
  private readonly logger = inject(tokenLogger);

  public async updateQuestion(args: UpdateQuestionUseCaseArgs): Promise<void> {
    await this.assessmentsRepository
      .updateQuestion({
        assessmentId: args.assessmentId,
        organization: args.user.organizationDomain,
        pillarId: args.pillarId,
        questionId: args.questionId,
        questionBody: args.questionBody,
      })
      .catch((error) => {
        if (
          error instanceof AssessmentNotFoundError ||
          error instanceof PillarNotFoundError ||
          error instanceof QuestionNotFoundError
        ) {
          throw new NotFoundError(error.message);
        } else if (error instanceof EmptyUpdateBodyError) {
          throw new NoContentError(error.description);
        }
        throw error;
      });
    this.logger.info(
      `Question#${args.assessmentId} from Assessment#${args.assessmentId} in organization#${args.user.organizationDomain} updated successfully`
    );
  }
}

export const tokenUpdateQuestionUseCase =
  createInjectionToken<UpdateQuestionUseCase>('UpdateQuestionUseCase', {
    useClass: UpdateQuestionUseCaseImpl,
  });
