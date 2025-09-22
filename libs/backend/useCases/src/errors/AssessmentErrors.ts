import { BasicErrorTypes } from '@shared/utils';

import { UseCaseError } from './UseCaseError';

export class AssessmentNotFoundError extends UseCaseError {
  public constructor(
    args: {
      assessmentId: string;
      organizationDomain: string;
    },
    description?: string
  ) {
    const { assessmentId, organizationDomain } = args;
    super({
      type: BasicErrorTypes.NOT_FOUND,
      message: `Assessment with id ${assessmentId} not found for organization with domain ${organizationDomain}`,
      description,
    });
  }
}

export class AssessmentNotFinishedError extends UseCaseError {
  public constructor(
    args: {
      assessmentId: string;
    },
    description?: string
  ) {
    const { assessmentId } = args;
    super({
      type: BasicErrorTypes.CONFLICT,
      message: `Assessment with id ${assessmentId} is not finished`,
      description,
    });
  }
}

export class AssessmentExportRegionNotSetError extends UseCaseError {
  public constructor(
    args: {
      assessmentId: string;
    },
    description?: string
  ) {
    const { assessmentId } = args;
    super({
      type: BasicErrorTypes.CONFLICT,
      message: `Assessment with id ${assessmentId} has no export region set`,
      description,
    });
  }
}
