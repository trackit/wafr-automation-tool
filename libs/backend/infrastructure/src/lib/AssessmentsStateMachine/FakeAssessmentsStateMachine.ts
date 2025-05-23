import type { AssessmentsStateMachine } from '@backend/ports';

export class FakeAssessmentsStateMachine implements AssessmentsStateMachine {
  public async startAssessment(): Promise<void> {
    // No-op for fake implementation
  }

  public async cancelAssessment(): Promise<void> {
    // No-op for fake implementation
  }
}
