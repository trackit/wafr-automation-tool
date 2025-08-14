import { type Assessment, AssessmentStep } from '@backend/models';
import { ConflictError, NoContentError } from '../lib/Errors';

export function assertAssessmentIsReadyForExport(assessment: Assessment): void {
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
}
