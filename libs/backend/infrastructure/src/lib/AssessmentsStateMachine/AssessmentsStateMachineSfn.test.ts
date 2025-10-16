import {
  StartExecutionCommand,
  StopExecutionCommand,
} from '@aws-sdk/client-sfn';
import { mockClient } from 'aws-sdk-client-mock';

import type { AssessmentsStateMachineStartAssessmentArgs } from '@backend/ports';
import { inject, reset } from '@shared/di-container';

import { IdGeneratorCrypto } from '../IdGenerator/IdGeneratorCrypto';
import { registerTestInfrastructure } from '../registerTestInfrastructure';
import {
  AssessmentsStateMachineSfn,
  tokenClientSfn,
  tokenStateMachineArn,
} from './AssessmentsStateMachineSfn';

describe('AssessmentsStateMachineSfn', () => {
  describe('startAssessment', () => {
    it('should start state machine', async () => {
      const { assessmentsStateMachineSfn, stateMachineArn, sfnClientMock } =
        setup();

      const input: AssessmentsStateMachineStartAssessmentArgs = {
        assessmentId: new IdGeneratorCrypto().generate(),
        createdAt: new Date(),
        name: 'Test Assessment',
        roleArn: 'arn:aws:iam::123456789012:role/test-role',
        workflows: [],
        regions: [],
        createdBy: 'test-user',
        organizationDomain: 'test.io',
      };
      sfnClientMock.on(StartExecutionCommand).resolves({
        startDate: new Date(),
        $metadata: { httpStatusCode: 200 },
        executionArn: 'test-execution-arn',
      });
      await assessmentsStateMachineSfn.startAssessment(input);

      const startExecutionCalls = sfnClientMock.commandCalls(
        StartExecutionCommand,
      );
      expect(startExecutionCalls).toHaveLength(1);
      const startExecutionCall = startExecutionCalls[0];
      expect(startExecutionCall.args[0].input).toEqual({
        stateMachineArn,
        input: expect.any(String),
      });
    });

    it('should throw an error when state machine fails to start', async () => {
      const { assessmentsStateMachineSfn, sfnClientMock } = setup();

      const input: AssessmentsStateMachineStartAssessmentArgs = {
        assessmentId: new IdGeneratorCrypto().generate(),
        createdAt: new Date(),
        name: 'Test Assessment',
        roleArn: 'arn:aws:iam::123456789012:role/test-role',
        workflows: [],
        regions: [],
        createdBy: 'test-user',
        organizationDomain: 'test.io',
      };
      sfnClientMock.on(StartExecutionCommand).resolves({
        $metadata: { httpStatusCode: 500 },
      });

      await expect(
        assessmentsStateMachineSfn.startAssessment(input),
      ).rejects.toThrow(Error);
    });

    it('should test the input of the state machine', async () => {
      const { assessmentsStateMachineSfn, sfnClientMock } = setup();

      const roleArn = 'arn:aws:iam::123456789012:role/test-role';
      const createdBy = 'test-user';
      const organizationDomain = 'test.io';
      const name = 'Test Assessment';
      const input: AssessmentsStateMachineStartAssessmentArgs = {
        assessmentId: new IdGeneratorCrypto().generate(),
        createdAt: new Date(),
        name,
        roleArn,
        workflows: [],
        regions: [],
        createdBy,
        organizationDomain,
      };
      sfnClientMock.on(StartExecutionCommand).resolves({
        startDate: new Date(),
        $metadata: { httpStatusCode: 200 },
        executionArn: 'test-execution-arn',
      });
      await assessmentsStateMachineSfn.startAssessment(input);

      const startExecutionCalls = sfnClientMock.commandCalls(
        StartExecutionCommand,
      );
      expect(startExecutionCalls).toHaveLength(1);
      const startExecutionCall = startExecutionCalls[0];
      expect(
        JSON.parse(startExecutionCall.args[0].input.input ?? '{}'),
      ).toEqual(
        expect.objectContaining({
          name,
          regions: [],
          workflows: [],
          roleArn,
          createdAt: input.createdAt.toISOString(),
          createdBy,
          organizationDomain,
        }),
      );
    });
  });

  describe('cancelAssessment', () => {
    it('should cancel state machine execution', async () => {
      const { assessmentsStateMachineSfn, sfnClientMock } = setup();

      sfnClientMock.on(StopExecutionCommand).resolves({
        $metadata: { httpStatusCode: 200 },
      });

      const executionArn = 'execution-arn';
      await assessmentsStateMachineSfn.cancelAssessment(executionArn);

      const stopExecutionCalls =
        sfnClientMock.commandCalls(StopExecutionCommand);
      expect(stopExecutionCalls).toHaveLength(1);
      const stopExecutionCall = stopExecutionCalls[0];
      expect(stopExecutionCall.args[0].input.executionArn).toEqual(
        executionArn,
      );
    });

    it('should throw an error when state machine fails to cancel', async () => {
      const { assessmentsStateMachineSfn, sfnClientMock } = setup();

      sfnClientMock.on(StopExecutionCommand).resolves({
        $metadata: { httpStatusCode: 500 },
      });

      await expect(
        assessmentsStateMachineSfn.cancelAssessment('execution-arn'),
      ).rejects.toThrow(Error);
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  const sfnClientMock = mockClient(inject(tokenClientSfn));

  return {
    assessmentsStateMachineSfn: new AssessmentsStateMachineSfn(),
    stateMachineArn: inject(tokenStateMachineArn),
    sfnClientMock,
  };
};
