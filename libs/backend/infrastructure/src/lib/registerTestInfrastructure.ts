import { register } from '@shared/di-container';
import {
  FakeLogger,
  tokenClientDynamoDB,
  tokenLogger,
} from '@backend/infrastructure';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  tokenDynamoDBConfig,
  testDynamoDbConfig,
} from './dynamodb/DynamoDbConfig';

export const registerTestInfrastructure = () => {
  register(tokenLogger, { useClass: FakeLogger });
  register(tokenDynamoDBConfig, {
    useValue: testDynamoDbConfig,
  });
  register(tokenClientDynamoDB, { useClass: DynamoDBClient });
};
