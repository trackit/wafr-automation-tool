import { AssessmentStep } from '@backend/models';

export type AssessmentsStateMachineStartAssessmentArgs = {
  name: string;
  regions: string[];
  roleArn: string;
  workflows: string[];
  assessmentId: string;
  createdAt: Date;
  createdBy: string;
  organization: string;
};

export interface AssessmentsStateMachine {
  getAssessmentStep(executionId: string): Promise<AssessmentStep>;
  startAssessment(
    args: AssessmentsStateMachineStartAssessmentArgs
  ): Promise<string>;
  cancelAssessment(executionId: string): Promise<void>;
}
