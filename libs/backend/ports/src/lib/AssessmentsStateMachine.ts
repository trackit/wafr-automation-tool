export type AssessmentsStateMachineStartAssessmentArgs = {
  name: string;
  regions: string[];
  roleArn: string;
  workflows: string[];
  assessmentId: string;
  createdAt: Date;
  createdBy: string;
  organizationDomain: string;
};

export interface AssessmentsStateMachine {
  startAssessment(
    args: AssessmentsStateMachineStartAssessmentArgs
  ): Promise<void>;
  cancelAssessment(executionId: string): Promise<void>;
}
