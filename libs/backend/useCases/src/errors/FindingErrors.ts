import { BasicErrorType } from '@shared/utils';

import { UseCaseError } from './UseCaseError';

export class FindingNotFoundError extends UseCaseError {
  public constructor(
    args: {
      assessmentId: string;
      organizationDomain: string;
      findingId: string;
    },
    description?: string,
  ) {
    const { assessmentId, findingId, organizationDomain } = args;
    super({
      type: BasicErrorType.NOT_FOUND,
      message: `Finding with findingId ${findingId} not found for assessment ${assessmentId} in organization ${organizationDomain}`,
      description,
    });
  }
}

export class FindingCommentNotFoundError extends UseCaseError {
  public constructor(
    args: {
      assessmentId: string;
      organizationDomain: string;
      findingId: string;
      commentId: string;
    },
    description?: string,
  ) {
    const { assessmentId, findingId, organizationDomain, commentId } = args;
    super({
      type: BasicErrorType.NOT_FOUND,
      message: `Comment with commentId ${commentId} not found for finding ${findingId} in assessment ${assessmentId} in organization ${organizationDomain}`,
      description,
    });
  }
}

export class FindingCommentForbiddenError extends UseCaseError {
  public constructor(
    args: {
      findingId: string;
      commentId: string;
      userEmail: string;
      actionType: 'delete' | 'update';
    },
    description?: string,
  ) {
    const { findingId, commentId, userEmail, actionType } = args;
    super({
      type: BasicErrorType.FORBIDDEN,
      message: `User ${userEmail} is not allowed to perform ${actionType} action on comment ${commentId} for finding ${findingId}`,
      description,
    });
  }
}
