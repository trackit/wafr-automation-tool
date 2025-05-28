import { register } from '@shared/di-container';
import {
  FakeLogger,
  tokenClientDynamoDB,
  tokenLogger,
} from '@backend/infrastructure';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const registerTestInfrastructure = () => {
  register(tokenLogger, { useClass: FakeLogger });
  register(tokenClientDynamoDB, { useClass: DynamoDBClient });
};
