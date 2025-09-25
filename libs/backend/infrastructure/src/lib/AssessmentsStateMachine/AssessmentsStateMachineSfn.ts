import {
  DescribeExecutionCommand,
  ExecutionStatus,
  GetExecutionHistoryCommand,
  SFNClient,
  StartExecutionCommand,
  StopExecutionCommand,
} from '@aws-sdk/client-sfn';

import { AssessmentStep } from '@backend/models';
import type {
  AssessmentsStateMachine,
  AssessmentsStateMachineStartAssessmentArgs,
} from '@backend/ports';
import { createInjectionToken, inject } from '@shared/di-container';
import { assertIsDefined } from '@shared/utils';

import { tokenLogger } from '../Logger';

export class AssessmentsStateMachineSfn implements AssessmentsStateMachine {
  private readonly client = inject(tokenClientSfn);
  private readonly stateMachineArn = inject(tokenStateMachineArn);
  private readonly logger = inject(tokenLogger);

  public async getAssessmentStep(
    executionArn: string
  ): Promise<AssessmentStep> {
    const historyResponse = await this.client.send(
      new GetExecutionHistoryCommand({
        executionArn,
        maxResults: 10,
        reverseOrder: true,
      })
    );
    const events = historyResponse.events || [];

    const knownStepToAssessmentStep: Record<string, AssessmentStep> = {
      Pass: AssessmentStep.SCANNING_STARTED,
      ScanningTools: AssessmentStep.SCANNING_STARTED,
      PrepareFindingsAssociations: AssessmentStep.PREPARING_ASSOCIATIONS,
      PromptMap: AssessmentStep.ASSOCIATING_FINDINGS,
      ComputeGraphData: AssessmentStep.ASSOCIATING_FINDINGS,
      Cleanup: AssessmentStep.FINISHED,
      CleanupOnError: AssessmentStep.ERRORED,
    };

    for (const event of events) {
      const stateName = event.stateEnteredEventDetails?.name;
      if (stateName && knownStepToAssessmentStep[stateName]) {
        return knownStepToAssessmentStep[stateName];
      }
    }

    const describeResponse = await this.client.send(
      new DescribeExecutionCommand({ executionArn })
    );

    return describeResponse.status === ExecutionStatus.SUCCEEDED
      ? AssessmentStep.FINISHED
      : AssessmentStep.ERRORED;
  }

  public async startAssessment(
    assessment: AssessmentsStateMachineStartAssessmentArgs
  ): Promise<string> {
    const input = {
      assessmentId: assessment.assessmentId,
      name: assessment.name,
      regions: assessment.regions,
      roleArn: assessment.roleArn,
      workflows: assessment.workflows,
      createdAt: assessment.createdAt,
      createdBy: assessment.createdBy,
      organization: assessment.organization,
    };
    const command = new StartExecutionCommand({
      input: JSON.stringify(input),
      stateMachineArn: this.stateMachineArn,
    });

    const response = await this.client.send(command);
    if (response.$metadata.httpStatusCode !== 200 || !response.executionArn) {
      throw new Error(
        `Failed to start assessment: ${response.$metadata.httpStatusCode}`
      );
    }
    this.logger.info(`Started Assessment#${assessment.assessmentId}`, input);
    return response.executionArn;
  }

  public async cancelAssessment(executionId: string): Promise<void> {
    const command = new StopExecutionCommand({ executionArn: executionId });

    const response = await this.client.send(command);
    if (response.$metadata.httpStatusCode !== 200) {
      throw new Error(
        `Failed to cancel assessment: ${response.$metadata.httpStatusCode}`
      );
    }
    this.logger.info(`Cancelled Assessment Execution#${executionId}`);
  }
}

export const tokenAssessmentsStateMachine =
  createInjectionToken<AssessmentsStateMachine>('AssessmentsStateMachine', {
    useClass: AssessmentsStateMachineSfn,
  });

export const tokenClientSfn = createInjectionToken<SFNClient>('ClientSfn', {
  useClass: SFNClient,
});

export const tokenStateMachineArn = createInjectionToken<string>(
  'StateMachineArn',
  {
    useFactory: () => {
      const stateMachineArn = process.env.STATE_MACHINE_ARN;
      assertIsDefined(stateMachineArn, 'STATE_MACHINE_ARN is not defined');
      return stateMachineArn;
    },
  }
);
