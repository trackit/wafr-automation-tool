import {
  type Assessment,
  AssessmentStep,
  Organization,
  Pillar,
} from '@backend/models';

import { ConflictError, NoContentError } from '../lib/Errors';

export function assertAssessmentIsReadyForExport(
  assessment: Assessment,
  exportRegion?: string
): asserts assessment is Assessment & {
  pillars: Pillar;
  step: AssessmentStep.FINISHED;
} {
  if (!assessment.pillars || assessment.step !== AssessmentStep.FINISHED) {
    throw new ConflictError(
      `Assessment with id ${assessment.id} is not finished`
    );
  }
  if (assessment.pillars.length === 0) {
    throw new NoContentError(
      `Assessment with id ${assessment.id} has no findings`
    );
  }
  if (!assessment.exportRegion && !exportRegion) {
    throw new ConflictError(
      `Assessment with id ${assessment.id} has no export region set`
    );
  }
}

export function assertOrganizationHasExportRole(
  organization: Organization
): asserts organization is Organization & { assessmentExportRoleArn: string } {
  if (!organization.assessmentExportRoleArn) {
    throw new ConflictError(
      `No assessment export role ARN found for organization ${organization.domain}`
    );
  }
}
