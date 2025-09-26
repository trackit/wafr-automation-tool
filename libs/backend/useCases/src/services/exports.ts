import { type Assessment, Organization, Pillar } from '@backend/models';

import {
  AssessmentExportRegionNotSetError,
  AssessmentNotFinishedError,
  OrganizationExportRoleNotSetError,
} from '../errors';

export function assertAssessmentIsReadyForExport(
  assessment: Assessment,
  exportRegion?: string
): asserts assessment is Assessment & {
  pillars: Pillar;
  finished: true;
} {
  if (
    !assessment.pillars ||
    assessment.pillars.length === 0 ||
    !assessment.finished
  ) {
    throw new AssessmentNotFinishedError({ assessmentId: assessment.id });
  }
  if (!assessment.exportRegion && !exportRegion) {
    throw new AssessmentExportRegionNotSetError({
      assessmentId: assessment.id,
    });
  }
}

export function assertOrganizationHasExportRole(
  organization: Organization
): asserts organization is Organization & { assessmentExportRoleArn: string } {
  if (!organization.assessmentExportRoleArn) {
    throw new OrganizationExportRoleNotSetError({
      domain: organization.domain,
    });
  }
}
