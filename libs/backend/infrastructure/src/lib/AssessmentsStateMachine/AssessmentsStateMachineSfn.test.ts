import {
  DescribeExecutionCommand,
  ExecutionStatus,
  GetExecutionHistoryCommand,
  StartExecutionCommand,
  StopExecutionCommand,
} from '@aws-sdk/client-sfn';
import { mockClient } from 'aws-sdk-client-mock';

import { AssessmentStep } from '@backend/models';
import type { AssessmentsStateMachineStartAssessmentArgs } from '@backend/ports';
import { inject, reset } from '@shared/di-container';

import { IdGeneratorCrypto } from '../IdGenerator/IdGeneratorCrypto';
import { registerTestInfrastructure } from '../registerTestInfrastructure';
import {
  AssessmentsStateMachineSfn,
  tokenClientSfn,
  tokenStateMachineArn,
} from './AssessmentsStateMachineSfn';

describe('AssessmentsStateMachine Infrastructure', () => {
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
        organization: 'test.io',
      };
      sfnClientMock.on(StartExecutionCommand).resolves({
        startDate: new Date(),
        $metadata: { httpStatusCode: 200 },
        executionArn: 'execution-arn',
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
        organization: 'test.io',
      };
      sfnClientMock.on(StartExecutionCommand).resolves({
        $metadata: { httpStatusCode: 500 },
      });

      await expect(
        assessmentsStateMachineSfn.startAssessment(input)
      ).rejects.toThrow(Error);
    });

    it('should test the input of the state machine', async () => {
      const { assessmentsStateMachineSfn, sfnClientMock } = setup();

      const input: AssessmentsStateMachineStartAssessmentArgs = {
        assessmentId: new IdGeneratorCrypto().generate(),
        createdAt: new Date(),
        name: 'Test Assessment',
        roleArn: 'arn:aws:iam::123456789012:role/test-role',
        workflows: [],
        regions: [],
        createdBy: 'test-user',
        organization: 'test.io',
      };
      sfnClientMock.on(StartExecutionCommand).resolves({
        startDate: new Date(),
        $metadata: { httpStatusCode: 200 },
        executionArn: 'execution-arn',
      });
      await assessmentsStateMachineSfn.startAssessment(input);

      const startExecutionCalls = sfnClientMock.commandCalls(
        StartExecutionCommand
      );
      expect(startExecutionCalls).toHaveLength(1);
      const startExecutionCall = startExecutionCalls[0];
      expect(
        JSON.parse(startExecutionCall.args[0].input.input ?? '{}')
      ).toEqual(
        expect.objectContaining({
          name: 'Test Assessment',
          regions: [],
          workflows: [],
          roleArn: 'arn:aws:iam::123456789012:role/test-role',
          createdAt: input.createdAt.toISOString(),
          createdBy: 'test-user',
          organization: 'test.io',
        })
      );
    });

    it('should return the executionArn when starting the assessment', async () => {
      const { assessmentsStateMachineSfn, sfnClientMock } = setup();

      const input: AssessmentsStateMachineStartAssessmentArgs = {
        assessmentId: new IdGeneratorCrypto().generate(),
        createdAt: new Date(),
        name: 'Test Assessment',
        roleArn: 'arn:aws:iam::123456789012:role/test-role',
        workflows: [],
        regions: [],
        createdBy: 'test-user',
        organization: 'test.io',
      };
      sfnClientMock.on(StartExecutionCommand).resolves({
        startDate: new Date(),
        $metadata: { httpStatusCode: 200 },
        executionArn: 'execution-arn',
      });
      const executionArn = await assessmentsStateMachineSfn.startAssessment(
        input
      );
      expect(executionArn).toEqual('execution-arn');
    });
  });

  describe('cancelAssessment', () => {
    it('should cancel state machine execution', async () => {
      const { assessmentsStateMachineSfn, sfnClientMock } = setup();

      sfnClientMock.on(StopExecutionCommand).resolves({
        $metadata: { httpStatusCode: 200 },
      });

      await assessmentsStateMachineSfn.cancelAssessment('execution-arn');

      const stopExecutionCalls =
        sfnClientMock.commandCalls(StopExecutionCommand);
      expect(stopExecutionCalls).toHaveLength(1);
      const stopExecutionCall = stopExecutionCalls[0];
      expect(stopExecutionCall.args[0].input.executionArn).toEqual(
        'execution-arn'
      );
    });

    it('should throw an error when state machine fails to cancel', async () => {
      const { assessmentsStateMachineSfn, sfnClientMock } = setup();

      sfnClientMock.on(StopExecutionCommand).resolves({
        $metadata: { httpStatusCode: 500 },
      });

      await expect(
        assessmentsStateMachineSfn.cancelAssessment('execution-arn')
      ).rejects.toThrow(Error);
    });
  });

  describe('getAssessmentStep', () => {
    it('should return SCANNING_STARTED for Pass state', async () => {
      const { assessmentsStateMachineSfn, sfnClientMock } = setup();
      sfnClientMock.on(GetExecutionHistoryCommand).resolves({
        events: [
          {
            stateEnteredEventDetails: { name: 'Pass' },
            timestamp: new Date(),
            type: undefined,
            id: 1,
          },
        ],
      });
      sfnClientMock.on(DescribeExecutionCommand).resolves({
        status: ExecutionStatus.RUNNING,
      });
      const step = await assessmentsStateMachineSfn.getAssessmentStep(
        'arn:aws:states:stateMachine'
      );
      expect(step).toBe(AssessmentStep.SCANNING_STARTED);
    });

    it('should return SCANNING_STARTED for ScanningTools state', async () => {
      const { assessmentsStateMachineSfn, sfnClientMock } = setup();
      sfnClientMock.on(GetExecutionHistoryCommand).resolves({
        events: [
          {
            stateEnteredEventDetails: { name: 'ScanningTools' },
            timestamp: new Date(),
            type: undefined,
            id: 2,
          },
        ],
      });
      sfnClientMock.on(DescribeExecutionCommand).resolves({
        status: ExecutionStatus.RUNNING,
      });
      const step = await assessmentsStateMachineSfn.getAssessmentStep(
        'arn:aws:states:stateMachine'
      );
      expect(step).toBe(AssessmentStep.SCANNING_STARTED);
    });

    it('should return SCANNING_STARTED for ProwlerScan state', async () => {
      const { assessmentsStateMachineSfn, sfnClientMock } = setup();
      sfnClientMock.on(GetExecutionHistoryCommand).resolves({
        events: [
          {
            stateEnteredEventDetails: { name: 'ProwlerScan' },
            timestamp: new Date(),
            type: undefined,
            id: 2,
          },
        ],
      });
      sfnClientMock.on(DescribeExecutionCommand).resolves({
        status: ExecutionStatus.RUNNING,
      });
      const step = await assessmentsStateMachineSfn.getAssessmentStep(
        'arn:aws:states:stateMachine'
      );
      expect(step).toBe(AssessmentStep.SCANNING_STARTED);
    });

    it('should return SCANNING_STARTED for PrepareCustodian state', async () => {
      const { assessmentsStateMachineSfn, sfnClientMock } = setup();
      sfnClientMock.on(GetExecutionHistoryCommand).resolves({
        events: [
          {
            stateEnteredEventDetails: { name: 'PrepareCustodian' },
            timestamp: new Date(),
            type: undefined,
            id: 2,
          },
        ],
      });
      sfnClientMock.on(DescribeExecutionCommand).resolves({
        status: ExecutionStatus.RUNNING,
      });
      const step = await assessmentsStateMachineSfn.getAssessmentStep(
        'arn:aws:states:stateMachine'
      );
      expect(step).toBe(AssessmentStep.SCANNING_STARTED);
    });

    it('should return SCANNING_STARTED for CloudSploitScan state', async () => {
      const { assessmentsStateMachineSfn, sfnClientMock } = setup();
      sfnClientMock.on(GetExecutionHistoryCommand).resolves({
        events: [
          {
            stateEnteredEventDetails: { name: 'CloudSploitScan' },
            timestamp: new Date(),
            type: undefined,
            id: 2,
          },
        ],
      });
      sfnClientMock.on(DescribeExecutionCommand).resolves({
        status: ExecutionStatus.RUNNING,
      });
      const step = await assessmentsStateMachineSfn.getAssessmentStep(
        'arn:aws:states:stateMachine'
      );
      expect(step).toBe(AssessmentStep.SCANNING_STARTED);
    });

    it('should return PREPARING_ASSOCIATIONS for PrepareFindingsAssociations state', async () => {
      const { assessmentsStateMachineSfn, sfnClientMock } = setup();
      sfnClientMock.on(GetExecutionHistoryCommand).resolves({
        events: [
          {
            stateEnteredEventDetails: { name: 'PrepareFindingsAssociations' },
            timestamp: new Date(),
            type: undefined,
            id: 2,
          },
        ],
      });
      sfnClientMock.on(DescribeExecutionCommand).resolves({
        status: ExecutionStatus.RUNNING,
      });
      const step = await assessmentsStateMachineSfn.getAssessmentStep(
        'arn:aws:states:stateMachine'
      );
      expect(step).toBe(AssessmentStep.PREPARING_ASSOCIATIONS);
    });

    it('should return ASSOCIATING_FINDINGS for PromptMap state', async () => {
      const { assessmentsStateMachineSfn, sfnClientMock } = setup();
      sfnClientMock.on(GetExecutionHistoryCommand).resolves({
        events: [
          {
            stateEnteredEventDetails: { name: 'PromptMap' },
            timestamp: new Date(),
            type: undefined,
            id: 3,
          },
        ],
      });
      sfnClientMock.on(DescribeExecutionCommand).resolves({
        status: ExecutionStatus.RUNNING,
      });
      const step = await assessmentsStateMachineSfn.getAssessmentStep(
        'arn:aws:states:stateMachine'
      );
      expect(step).toBe(AssessmentStep.ASSOCIATING_FINDINGS);
    });

    it('should return ASSOCIATING_FINDINGS for ComputeGraphData state', async () => {
      const { assessmentsStateMachineSfn, sfnClientMock } = setup();
      sfnClientMock.on(GetExecutionHistoryCommand).resolves({
        events: [
          {
            stateEnteredEventDetails: { name: 'ComputeGraphData' },
            timestamp: new Date(),
            type: undefined,
            id: 4,
          },
        ],
      });
      sfnClientMock.on(DescribeExecutionCommand).resolves({
        status: ExecutionStatus.RUNNING,
      });
      const step = await assessmentsStateMachineSfn.getAssessmentStep(
        'arn:aws:states:stateMachine'
      );
      expect(step).toBe(AssessmentStep.ASSOCIATING_FINDINGS);
    });

    it('should return ASSOCIATING_FINDINGS for AssociateFindingsChunkToBestPractices state', async () => {
      const { assessmentsStateMachineSfn, sfnClientMock } = setup();
      sfnClientMock.on(GetExecutionHistoryCommand).resolves({
        events: [
          {
            stateEnteredEventDetails: {
              name: 'AssociateFindingsChunkToBestPractices',
            },
            timestamp: new Date(),
            type: undefined,
            id: 5,
          },
        ],
      });
      sfnClientMock.on(DescribeExecutionCommand).resolves({
        status: ExecutionStatus.RUNNING,
      });
      const step = await assessmentsStateMachineSfn.getAssessmentStep(
        'arn:aws:states:stateMachine'
      );
      expect(step).toBe(AssessmentStep.ASSOCIATING_FINDINGS);
    });

    it('should return SCANNING_STARTED if no known state but execution is RUNNING', async () => {
      const { assessmentsStateMachineSfn, sfnClientMock } = setup();
      sfnClientMock.on(GetExecutionHistoryCommand).resolves({ events: [] });
      sfnClientMock
        .on(DescribeExecutionCommand)
        .resolves({ status: ExecutionStatus.RUNNING });
      const step = await assessmentsStateMachineSfn.getAssessmentStep(
        'arn:aws:states:stateMachine'
      );
      expect(step).toBe(AssessmentStep.SCANNING_STARTED);
    });

    it('should return FINISHED for Cleanup exited state', async () => {
      const { assessmentsStateMachineSfn, sfnClientMock } = setup();
      sfnClientMock.on(GetExecutionHistoryCommand).resolves({
        events: [
          {
            stateExitedEventDetails: { name: 'Cleanup' },
            timestamp: new Date(),
            type: undefined,
            id: 6,
          },
        ],
      });
      sfnClientMock.on(DescribeExecutionCommand).resolves({
        status: ExecutionStatus.SUCCEEDED,
      });
      const step = await assessmentsStateMachineSfn.getAssessmentStep(
        'arn:aws:states:stateMachine'
      );
      expect(step).toBe(AssessmentStep.FINISHED);
    });

    it('should return ERRORED if execution status is not SUCCEEDED and no known state', async () => {
      const { assessmentsStateMachineSfn, sfnClientMock } = setup();
      sfnClientMock.on(GetExecutionHistoryCommand).resolves({ events: [] });
      sfnClientMock
        .on(DescribeExecutionCommand)
        .resolves({ status: ExecutionStatus.FAILED });
      const step = await assessmentsStateMachineSfn.getAssessmentStep(
        'arn:aws:states:stateMachine'
      );
      expect(step).toBe(AssessmentStep.ERRORED);
    });

    it('should use the latest relevant state from multiple history events', async () => {
      const { assessmentsStateMachineSfn, sfnClientMock } = setup();
      sfnClientMock.on(GetExecutionHistoryCommand).resolves({
        events: [
          {
            stateEnteredEventDetails: { name: 'ComputeGraphData' },
            timestamp: new Date(),
            type: undefined,
            id: 5,
          },
          {
            stateEnteredEventDetails: { name: 'PromptMap' },
            timestamp: new Date(),
            type: undefined,
            id: 4,
          },
          {
            stateEnteredEventDetails: { name: 'PrepareFindingsAssociations' },
            timestamp: new Date(),
            type: undefined,
            id: 3,
          },
        ],
      });
      sfnClientMock.on(DescribeExecutionCommand).resolves({
        status: ExecutionStatus.RUNNING,
      });
      const step = await assessmentsStateMachineSfn.getAssessmentStep(
        'arn:aws:states:stateMachine'
      );
      expect(step).toBe(AssessmentStep.ASSOCIATING_FINDINGS);
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  const assessmentsStateMachineSfn = new AssessmentsStateMachineSfn();
  const sfnClientMock = mockClient(inject(tokenClientSfn));
  return {
    assessmentsStateMachineSfn,
    stateMachineArn: inject(tokenStateMachineArn),
    sfnClientMock,
  };
};
