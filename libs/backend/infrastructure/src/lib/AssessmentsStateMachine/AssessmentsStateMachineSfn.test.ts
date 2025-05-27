import { mockClient } from 'aws-sdk-client-mock';
import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';

import { register, reset } from '@shared/di-container';
import type { AssessmentsStateMachineStartAssessmentArgs } from '@backend/ports';

import {
  AssessmentsStateMachineSfn,
  tokenClientSfn,
  tokenStateMachineArn,
} from './AssessmentsStateMachineSfn';
import { IdGeneratorCrypto } from '../IdGenerator/IdGeneratorCrypto';
import { tokenLogger, FakeLogger } from '../Logger';

describe('AssessmentsStateMachine Infrastructure', () => {
  const TestRoleArn = 'arn:aws:iam::123456789012:role/test-role';
  const TestName = 'Test Assessment';

  it('should start state machine', async () => {
    const { assessmentsStateMachineSfn, stateMachineArn, sfnClientMock } =
      setup();

    const input: AssessmentsStateMachineStartAssessmentArgs = {
      assessmentId: new IdGeneratorCrypto().generate(),
      createdAt: new Date(),
      name: TestName,
      roleArn: TestRoleArn,
      workflows: [],
      regions: [],
      createdBy: 'test-user',
      organization: 'test.io',
    };
    sfnClientMock.on(StartExecutionCommand).resolves({
      startDate: new Date(),
      $metadata: { httpStatusCode: 200 },
    });
    await assessmentsStateMachineSfn.startAssessment(input);

    const startExecutionCalls = sfnClientMock.commandCalls(
      StartExecutionCommand
    );
    expect(startExecutionCalls).toHaveLength(1);
    const startExecutionCall = startExecutionCalls[0];
    expect(startExecutionCall.args[0].input).toEqual({
      stateMachineArn,
      input: expect.any(String),
    });
  });

  it('should throw error when state machine fails to start', async () => {
    const { assessmentsStateMachineSfn, sfnClientMock } = setup();

    const input: AssessmentsStateMachineStartAssessmentArgs = {
      assessmentId: new IdGeneratorCrypto().generate(),
      createdAt: new Date(),
      name: TestName,
      roleArn: TestRoleArn,
      workflows: [],
      regions: [],
      createdBy: 'test-user',
      organization: 'test.io',
    };
    sfnClientMock.on(StartExecutionCommand).resolves({
      $metadata: { httpStatusCode: 500 },
    });

    await expect(
      assessmentsStateMachineSfn.startAssessment(input)
    ).rejects.toThrowError('Failed to start assessment: 500');
  });

  it('should test the input of the state machine', async () => {
    const { assessmentsStateMachineSfn, sfnClientMock } = setup();

    const input: AssessmentsStateMachineStartAssessmentArgs = {
      assessmentId: new IdGeneratorCrypto().generate(),
      createdAt: new Date(),
      name: TestName,
      roleArn: TestRoleArn,
      workflows: [],
      regions: [],
      createdBy: 'test-user',
      organization: 'test.io',
    };
    sfnClientMock.on(StartExecutionCommand).resolves({
      startDate: new Date(),
      $metadata: { httpStatusCode: 200 },
    });
    await assessmentsStateMachineSfn.startAssessment(input);

    const startExecutionCalls = sfnClientMock.commandCalls(
      StartExecutionCommand
    );
    expect(startExecutionCalls).toHaveLength(1);
    const startExecutionCall = startExecutionCalls[0];
    expect(JSON.parse(startExecutionCall.args[0].input.input ?? '{}')).toEqual({
      assessment_id: input.assessmentId,
      name: input.name,
      regions: [],
      workflows: [],
      role_arn: input.roleArn,
      created_at: input.createdAt.toISOString(),
      created_by: input.createdBy,
      organization: input.organization,
    });
  });
});

const setup = () => {
  reset();
  const sfnClientMock = mockClient(SFNClient);
  const stateMachineArn =
    'arn:aws:states:us-west-2:123456789012:stateMachine:MyStateMachine';
  register(tokenClientSfn, { useClass: SFNClient });
  register(tokenStateMachineArn, { useValue: stateMachineArn });
  register(tokenLogger, { useClass: FakeLogger });
  const assessmentsStateMachineSfn = new AssessmentsStateMachineSfn();

  return { assessmentsStateMachineSfn, stateMachineArn, sfnClientMock };
};
