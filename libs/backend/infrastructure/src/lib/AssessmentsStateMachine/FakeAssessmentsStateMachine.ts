import { AssessmentStep } from '@backend/models';
import type { AssessmentsStateMachine } from '@backend/ports';
import { createInjectionToken } from '@shared/di-container';

export class FakeAssessmentsStateMachine implements AssessmentsStateMachine {
  public async getAssessmentStep(): Promise<AssessmentStep> {
    return AssessmentStep.FINISHED;
  }

  public async startAssessment(): Promise<string> {
    // No-op for fake implementation
    return 'fake-execution-id';
  }

  public async cancelAssessment(): Promise<void> {
    // No-op for fake implementation
  }
}

export const tokenFakeAssessmentsStateMachine =
  createInjectionToken<FakeAssessmentsStateMachine>(
    'FakeAssessmentsStateMachine',
    { useClass: FakeAssessmentsStateMachine },
  );
