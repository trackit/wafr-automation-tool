import { inject, register } from '@shared/di-container';

import {
  tokenAssessmentsRepository,
  tokenFakeAssessmentsRepository,
} from './AssessmentsRepository';
import {
  tokenAssessmentsStateMachine,
  tokenFakeAssessmentsStateMachine,
  tokenStateMachineArn,
} from './AssessmentsStateMachine';
import { FakeIdGenerator, tokenIdGenerator } from './IdGenerator';
import { FakeLogger, tokenLogger } from './Logger';
import {
  tokenFakeWellArchitectedToolService,
  tokenWellArchitectedToolService,
} from './WellArchitectedToolService';
import {
  testDynamoDbConfig,
  tokenDynamoDBConfig,
} from './config/dynamodb/config';

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
  register(tokenWellArchitectedToolService, {
    useFactory: () => inject(tokenFakeWellArchitectedToolService),
  });
};
