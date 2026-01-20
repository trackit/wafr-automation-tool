import {
  type AssessmentFileExport,
  type AssessmentFileExportType,
} from '@backend/models';
import { BasicErrorType } from '@shared/utils';

import { UseCaseError } from './UseCaseError';

export class AssessmentNotFoundError extends UseCaseError {
  public constructor(
    args: {
      assessmentId: string;
      organizationDomain: string;
    },
    description?: string,
  ) {
    const { assessmentId, organizationDomain } = args;
    super({
      type: BasicErrorType.NOT_FOUND,
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
    description?: string,
  ) {
    const { assessmentId } = args;
    super({
      type: BasicErrorType.CONFLICT,
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
    description?: string,
  ) {
    const { assessmentId } = args;
    super({
      type: BasicErrorType.CONFLICT,
      message: `Assessment with id ${assessmentId} has no export region set`,
      description,
    });
  }
}

export class AssessmentFileExportNotFoundError extends UseCaseError {
  public constructor(
    args: {
      assessmentId: string;
      fileExportId: string;
      fileExportType: AssessmentFileExportType;
    },
    description?: string,
  ) {
    const { assessmentId, fileExportId, fileExportType } = args;
    super({
      type: BasicErrorType.NOT_FOUND,
      message: `${fileExportType.toUpperCase()} export with id ${fileExportId} not found for assessment ${assessmentId}`,
      description,
    });
  }
}

export class AssessmentFileExportNotFinishedError extends UseCaseError {
  public constructor(
    args: {
      assessmentId: string;
      fileExportId: string;
      fileExportType: AssessmentFileExportType;
    },
    description?: string,
  ) {
    const { assessmentId, fileExportId, fileExportType } = args;
    super({
      type: BasicErrorType.CONFLICT,
      message: `${fileExportType.toUpperCase()} export with id ${fileExportId} is not finished for assessment ${assessmentId}`,
      description,
    });
  }
}

export class AssessmentFileExportFieldNotFoundError extends UseCaseError {
  constructor(
    args: {
      assessmentId: string;
      fileExportId: string;
      fileExportType: AssessmentFileExportType;
      fieldName: keyof AssessmentFileExport;
    },
    description?: string,
  ) {
    const { assessmentId, fileExportId, fileExportType, fieldName } = args;
    super({
      type: BasicErrorType.NOT_FOUND,
      message: `${fileExportType.toUpperCase()} export with id ${fileExportId} has no field ${fieldName} for assessment ${assessmentId}`,
      description,
    });
  }
}

export class AssessmentFileExportAlreadyExistsError extends UseCaseError {
  constructor(
    args: {
      assessmentId: string;
      fileExportType: AssessmentFileExportType;
      versionName: string;
    },
    description?: string,
  ) {
    const { assessmentId, fileExportType, versionName } = args;
    super({
      type: BasicErrorType.CONFLICT,
      message: `${fileExportType.toUpperCase()} export with version ${versionName} already exists for assessment ${assessmentId}`,
      description,
    });
  }
}

export class AssessmentOpportunityAlreadyLinkedError extends UseCaseError {
  constructor(
    args: {
      assessmentId: string;
      opportunityId: string;
    },
    description?: string,
  ) {
    const { assessmentId, opportunityId } = args;
    super({
      type: BasicErrorType.CONFLICT,
      message: `Assessment with id ${assessmentId} is linked already to opportunity ${opportunityId}`,
      description,
    });
  }
}

export class AssessmentVersionCreationError extends UseCaseError {
  constructor(
    args: {
      assessmentId: string;
    },
    description?: string,
  ) {
    const { assessmentId } = args;
    super({
      type: BasicErrorType.CONFLICT,
      message: `Failed to create new version for Assessment with id ${assessmentId}`,
      description,
    });
  }
}
