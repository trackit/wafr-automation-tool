import { UseCaseError } from './UseCaseError';

export class AssessmentNotFoundError extends UseCaseError {
  public constructor(
    args: {
      assessmentId: string;
      organization: string;
    },
    description?: string
  ) {
    const { assessmentId, organization } = args;
    super({
      category: 'NOT_FOUND',
      message: `Assessment with id ${assessmentId} not found for organization ${organization}`,
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
      category: 'CONFLICT',
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
      category: 'CONFLICT',
      message: `Assessment with id ${assessmentId} has no export region set`,
      description,
    });
  }
}
