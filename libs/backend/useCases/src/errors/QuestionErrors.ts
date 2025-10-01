import { BasicErrorType } from '@shared/utils';

import { UseCaseError } from './UseCaseError';

export class QuestionNotFoundError extends UseCaseError {
  public constructor(
    args: {
      assessmentId: string;
      organizationDomain: string;
      pillarId: string;
      questionId: string;
    },
    description?: string,
  ) {
    const { assessmentId, organizationDomain, pillarId, questionId } = args;
    super({
      type: BasicErrorType.NOT_FOUND,
      message: `Question with id ${questionId} not found for assessment with id ${assessmentId} for organization with domain ${organizationDomain} and pillar with id ${pillarId}`,
      description,
    });
  }
}
