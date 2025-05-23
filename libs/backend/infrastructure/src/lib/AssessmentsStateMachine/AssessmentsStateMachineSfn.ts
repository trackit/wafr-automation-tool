import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';

import { inject, createInjectionToken } from '@shared/di-container';
import { assertIsDefined } from '@shared/utils';
import type {
  AssessmentsStateMachine,
  AssessmentsStateMachineStartAssessmentArgs,
} from '@backend/ports';

import { tokenLogger } from '../Logger';

export class AssessmentsStateMachineSfn implements AssessmentsStateMachine {
  private readonly client = inject(tokenClientSfn);
  private readonly stateMachineArn = inject(tokenStateMachineArn);
  private readonly logger = inject(tokenLogger);

  public async startAssessment(
    assessment: AssessmentsStateMachineStartAssessmentArgs
  ): Promise<void> {
    const input = {
      assessment_id: assessment.assessmentId,
      name: assessment.name,
      regions: assessment.regions,
      role_arn: assessment.roleArn,
      workflows: assessment.workflows,
      created_at: assessment.createdAt,
      created_by: assessment.createdBy,
      organization: assessment.organization,
    };
    const command = new StartExecutionCommand({
      input: JSON.stringify(input),
      stateMachineArn: this.stateMachineArn,
    });

    const response = await this.client.send(command);
    if (response.$metadata.httpStatusCode !== 200) {
      throw new Error(
        `Failed to start assessment: ${response.$metadata.httpStatusCode}`
      );
    }
    this.logger.info(`Started Assessment#${assessment.assessmentId}`, input);
  }

  public async cancelAssessment(executionId: string): Promise<void> {
    throw new Error('Not implemented');
  }
}

export const tokenAssessmentsStateMachine =
  createInjectionToken<AssessmentsStateMachine>(
    'tokenAssessmentsStateMachine',
    {
      useClass: AssessmentsStateMachineSfn,
    }
  );

export const tokenClientSfn = createInjectionToken<SFNClient>(
  'tokenClientSfn',
  { useClass: SFNClient }
);

export const tokenStateMachineArn = createInjectionToken<string>(
  'tokenStateMachineArn',
  {
    useFactory: () => {
      const stateMachineArn = process.env.STATE_MACHINE_ARN;
      assertIsDefined(stateMachineArn, 'STATE_MACHINE_ARN is not defined');
      return stateMachineArn;
    },
  }
);
