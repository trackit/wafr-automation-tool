import { BasicErrorType } from '@shared/utils';

import { UseCaseError } from './UseCaseError';

export class MilestoneNotFoundError extends UseCaseError {
  public constructor(
    args: {
      assessmentId: string;
      milestoneId: number;
    },
    description?: string
  ) {
    const { assessmentId, milestoneId } = args;
    super({
      type: BasicErrorType.NOT_FOUND,
      message: `Milestone with id ${milestoneId} not found for assessment with id ${assessmentId}`,
      description,
    });
  }
}
