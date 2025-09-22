import {
  SFNClient,
  StartExecutionCommand,
  StopExecutionCommand,
} from '@aws-sdk/client-sfn';

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

  public async startAssessment(
    startAssessmentInput: AssessmentsStateMachineStartAssessmentArgs
  ): Promise<void> {
    const command = new StartExecutionCommand({
      input: JSON.stringify(startAssessmentInput),
      stateMachineArn: this.stateMachineArn,
    });

    const response = await this.client.send(command);
    if (response.$metadata.httpStatusCode !== 200) {
      throw new Error(JSON.stringify(response));
    }
    this.logger.info(
      `Started Assessment#${startAssessmentInput.assessmentId}`,
      startAssessmentInput
    );
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
  }
);
