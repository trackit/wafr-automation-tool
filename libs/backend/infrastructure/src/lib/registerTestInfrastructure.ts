import { SFNClient } from '@aws-sdk/client-sfn';

import { inject, register } from '@shared/di-container';

import { FakeLogger, tokenLogger } from './Logger';
import {
  tokenDynamoDBConfig,
  testDynamoDbConfig,
} from './config/dynamodb/config';
import {
  tokenAssessmentsStateMachine,
  tokenFakeAssessmentsStateMachine,
  tokenStateMachineArn,
} from './AssessmentsStateMachine';
import {
  tokenAssessmentsRepository,
  tokenFakeAssessmentsRepository,
} from './AssessmentsRepository';
import { FakeIdGenerator, tokenIdGenerator } from './IdGenerator';

export const registerTestInfrastructure = () => {
  register(tokenLogger, { useClass: FakeLogger });
  register(tokenDynamoDBConfig, { useValue: testDynamoDbConfig });
  register(tokenStateMachineArn, { useValue: 'arn:test-state-machine-arn' });
  register(tokenAssessmentsStateMachine, {
    useFactory: () => inject(tokenFakeAssessmentsStateMachine),
  });
  register(tokenAssessmentsRepository, {
    useFactory: () => inject(tokenFakeAssessmentsRepository),
  });
  register(tokenIdGenerator, { useClass: FakeIdGenerator });
};
