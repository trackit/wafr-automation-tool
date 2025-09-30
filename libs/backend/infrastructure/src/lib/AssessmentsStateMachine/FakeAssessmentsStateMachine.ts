import type { AssessmentsStateMachine } from '@backend/ports';
import { createInjectionToken } from '@shared/di-container';

export class FakeAssessmentsStateMachine implements AssessmentsStateMachine {
  public async startAssessment(): Promise<void> {
    // No-op for fake implementation
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
