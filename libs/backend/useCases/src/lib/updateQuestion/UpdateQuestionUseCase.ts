import {
  tokenAssessmentsRepository,
  tokenLogger,
} from '@backend/infrastructure';
import type { QuestionBody, User } from '@backend/models';
import { createInjectionToken, inject } from '@shared/di-container';

import { AssessmentNotFoundError } from '../../errors';
import { assertQuestionExists } from '../../services/asserts';

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
    const { assessmentId, pillarId, questionId, user, questionBody } = args;
    const { organizationDomain } = user;

    const assessment = await this.assessmentsRepository.get({
      assessmentId,
      organizationDomain,
    });
    if (!assessment) {
      throw new AssessmentNotFoundError({
        assessmentId,
        organizationDomain,
      });
    }
    assertQuestionExists({
      assessment,
      pillarId,
      questionId,
    });

    await this.assessmentsRepository.updateQuestion({
      assessmentId,
      organizationDomain,
      pillarId,
      questionId,
      questionBody,
    });
    this.logger.info(
      `Question#${args.assessmentId} from Assessment#${args.assessmentId} in organization#${args.user.organizationDomain} updated successfully`,
    );
  }
}

export const tokenUpdateQuestionUseCase =
  createInjectionToken<UpdateQuestionUseCase>('UpdateQuestionUseCase', {
    useClass: UpdateQuestionUseCaseImpl,
  });
