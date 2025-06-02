import { SFNClient } from '@aws-sdk/client-sfn';
import { mockClient } from 'aws-sdk-client-mock';

import { createInjectionToken, inject, register } from '@shared/di-container';

import { FakeLogger, tokenLogger } from './Logger';
import {
  tokenDynamoDBConfig,
  testDynamoDbConfig,
} from './config/dynamodb/config';
import {
  FakeAssessmentsStateMachine,
  tokenAssessmentsStateMachine,
  tokenClientSfn,
  tokenMockClientSfn,
  tokenStateMachineArn,
} from './AssessmentsStateMachine';
import {
  FakeAssessmentsRepository,
  tokenAssessmentsRepository,
} from './AssessmentsRepository';

export const registerTestInfrastructure = () => {
  register(tokenLogger, { useClass: FakeLogger });
  register(tokenDynamoDBConfig, { useValue: testDynamoDbConfig });

  register(tokenClientSfn, {
    useValue: inject(tokenMockClientSfn) as unknown as SFNClient,
  });

  const stateMachineArn = 'arn:test-state-machine-arn';
  register(tokenStateMachineArn, { useValue: stateMachineArn });
  const fakeAssessmentsStateMachine = new FakeAssessmentsStateMachine();
  register(tokenAssessmentsStateMachine, {
    useValue: fakeAssessmentsStateMachine,
  });
  const fakeAssessmentsRepository = new FakeAssessmentsRepository();
  register(tokenAssessmentsRepository, { useValue: fakeAssessmentsRepository });

  return {
    sfnClientMock: inject(tokenMockClientSfn), // TODO: remove this return and add inject when needed
    stateMachineArn,
    fakeAssessmentsStateMachine,
    fakeAssessmentsRepository,
  };
};
