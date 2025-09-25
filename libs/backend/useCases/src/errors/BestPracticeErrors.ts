import { BasicErrorType } from '@shared/utils';

import { UseCaseError } from './UseCaseError';

export class BestPracticeNotFoundError extends UseCaseError {
  public constructor(
    args: {
      assessmentId: string;
      organizationDomain: string;
      pillarId: string;
      questionId: string;
      bestPracticeId: string;
    },
    description?: string
  ) {
    const {
      assessmentId,
      organizationDomain,
      pillarId,
      questionId,
      bestPracticeId,
    } = args;
    super({
      type: BasicErrorType.NOT_FOUND,
      message: `Best practice with id ${bestPracticeId} not found for assessment with id ${assessmentId} for organization with domain ${organizationDomain} and pillar with id ${pillarId} and question with id ${questionId}`,
      description,
    });
  }
}

export class BestPracticeEmptyUpdateBodyError extends UseCaseError {
  public constructor(
    args: {
      assessmentId: string;
      organizationDomain: string;
      pillarId: string;
      questionId: string;
      bestPracticeId: string;
    },
    description?: string
  ) {
    const {
      assessmentId,
      organizationDomain,
      pillarId,
      questionId,
      bestPracticeId,
    } = args;
    super({
      type: BasicErrorType.CONFLICT,
      message: `Nothing to update for best practice with id ${bestPracticeId} in assessment with id ${assessmentId} for organization with domain ${organizationDomain} and pillar with id ${pillarId} and question with id ${questionId}`,
      description,
    });
  }
}
