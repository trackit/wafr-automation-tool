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
    executionArn: string,
  ): Promise<AssessmentStep> {
    const historyResponse = await this.client.send(
      new GetExecutionHistoryCommand({
        executionArn,
        maxResults: 100,
        reverseOrder: true,
      }),
    );
    const events = historyResponse.events || [];

    const knownStateToAssessmentStep: Record<string, AssessmentStep> = {
      AssignVariables: AssessmentStep.SCANNING_STARTED,
      ScanningTools: AssessmentStep.SCANNING_STARTED,
      ProwlerScan: AssessmentStep.SCANNING_STARTED,
      PrepareCustodian: AssessmentStep.SCANNING_STARTED,
      CloudSploitScan: AssessmentStep.SCANNING_STARTED,
      PrepareFindingsAssociations: AssessmentStep.PREPARING_ASSOCIATIONS,
      PromptMap: AssessmentStep.ASSOCIATING_FINDINGS,
      AssociateFindingsChunkToBestPractices:
        AssessmentStep.ASSOCIATING_FINDINGS,
      CleanupOnError: AssessmentStep.ERRORED,
    };
    for (const event of events) {
      const stateName = event.stateEnteredEventDetails?.name;
      const stateExitedName = event.stateExitedEventDetails?.name;
      if (stateExitedName === 'Cleanup') {
        return AssessmentStep.FINISHED;
      }
      if (stateName && knownStateToAssessmentStep[stateName]) {
        return knownStateToAssessmentStep[stateName];
      }
    }

    const describeResponse = await this.client.send(
      new DescribeExecutionCommand({ executionArn }),
    );
    if (describeResponse.status === ExecutionStatus.RUNNING) {
      return AssessmentStep.SCANNING_STARTED;
    }
    return AssessmentStep.ERRORED;
  }

  public async startAssessment(
    startAssessmentInput: AssessmentsStateMachineStartAssessmentArgs,
  ): Promise<string> {
    const command = new StartExecutionCommand({
      input: JSON.stringify(startAssessmentInput),
      stateMachineArn: this.stateMachineArn,
    });

    const response = await this.client.send(command);
    if (response.$metadata.httpStatusCode !== 200 || !response.executionArn) {
      throw new Error(JSON.stringify(response));
    }
    this.logger.info(
      `Started Assessment#${startAssessmentInput.assessmentId}`,
      startAssessmentInput,
    );
    return response.executionArn;
  }

  public async cancelAssessment(executionId: string): Promise<void> {
    const command = new StopExecutionCommand({ executionArn: executionId });

    const response = await this.client.send(command);
    if (response.$metadata.httpStatusCode !== 200) {
      throw new Error(JSON.stringify(response));
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
  },
);
