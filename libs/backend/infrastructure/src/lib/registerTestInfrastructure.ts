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
import {
  testDynamoDbConfig,
  tokenDynamoDBConfig,
} from './config/dynamodb/config';
import { FakeIdGenerator, tokenIdGenerator } from './IdGenerator';
import { FakeLogger, tokenLogger } from './Logger';
import {
  tokenFakeObjectStorage,
  tokenObjectStorage,
  tokenS3Bucket,
} from './ObjectStorage';
import {
  tokenFakeWellArchitectedToolService,
  tokenWellArchitectedToolService,
} from './WellArchitectedToolService';

export const registerTestInfrastructure = () => {
  register(tokenLogger, { useClass: FakeLogger });
  register(tokenDynamoDBConfig, { useValue: testDynamoDbConfig });
  register(tokenStateMachineArn, { useValue: 'arn:test-state-machine-arn' });
  register(tokenS3Bucket, { useValue: 'test-s3-bucket' });
  register(tokenAssessmentsStateMachine, {
    useFactory: () => inject(tokenFakeAssessmentsStateMachine),
  });
  register(tokenAssessmentsRepository, {
    useFactory: () => inject(tokenFakeAssessmentsRepository),
  });
  register(tokenObjectStorage, {
    useFactory: () => inject(tokenFakeObjectStorage),
  });
  register(tokenIdGenerator, { useClass: FakeIdGenerator });
  register(tokenWellArchitectedToolService, {
    useFactory: () => inject(tokenFakeWellArchitectedToolService),
  });
};
