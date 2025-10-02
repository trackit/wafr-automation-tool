import {
  InvokeCommand,
  ResourceNotFoundException,
} from '@aws-sdk/client-lambda';
import { mockClient } from 'aws-sdk-client-mock';

import { inject, reset } from '@shared/di-container';

import { registerTestInfrastructure } from '../registerTestInfrastructure';
import { LambdaService, tokenLambdaClient } from './LambdaService';

describe('LambdaService', () => {
  describe('invokeLambda', () => {
    it('should invoke a lambda', async () => {
      const { lambdaService, lambdaClientMock } = setup();

      lambdaClientMock.on(InvokeCommand).resolves({
        $metadata: { httpStatusCode: 200 },
      });

      const lambdaArn =
        'arn:aws:lambda:us-west-2:123456789012:function:test-lambda';
      await expect(
        lambdaService.asyncInvokeLambda({
          lambdaArn,
          payload: JSON.stringify({ test: 'payload' }),
        }),
      ).resolves.toBeUndefined();

      const executionCalls = lambdaClientMock.commandCalls(InvokeCommand);
      expect(executionCalls).toHaveLength(1);

      const executionCall = executionCalls[0];
      expect(executionCall.args[0].input).toEqual({
        FunctionName: lambdaArn,
        InvocationType: 'Event',
        Payload: JSON.stringify({ test: 'payload' }),
      });
    });

    it('should throw an error if the lambda invocation fails', async () => {
      const { lambdaService, lambdaClientMock } = setup();

      lambdaClientMock.on(InvokeCommand).rejects(
        new ResourceNotFoundException({
          $metadata: { httpStatusCode: 404 },
          message: 'Resource not found',
        }),
      );

      await expect(
        lambdaService.asyncInvokeLambda({
          lambdaArn:
            'arn:aws:lambda:us-west-2:123456789012:function:test-lambda',
          payload: JSON.stringify({ test: 'payload' }),
        }),
      ).rejects.toThrow(ResourceNotFoundException);
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  return {
    lambdaService: new LambdaService(),
    lambdaClientMock: mockClient(inject(tokenLambdaClient)),
  };
};
