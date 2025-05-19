export type AssessmentsStateMachineStartAssessmentArgs = {
  name: string;
  regions?: string[];
  roleArn: string;
  workflows: string[];
  assessmentId: string;
  createdAt: Date;
};

export interface AssessmentsStateMachine {
  startAssessment(
    args: AssessmentsStateMachineStartAssessmentArgs
  ): Promise<void>;
}
