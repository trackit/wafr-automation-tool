/* eslint no-console: 0 */

import { CreateTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { env } from './localEnvironment';

const dynamodb = new DynamoDBClient({
  endpoint: 'http://127.0.0.1:8000',
  credentials: {
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    accessKeyId: env.AWS_ACCESS_KEY_ID,
  },
  region: env.AWS_REGION,
  logger: console,
  maxAttempts: 10, // Retry attempts
});

const createTables = async () => {
  console.log('Creating DynamoDB tables...');
  console.log('config', dynamodb.config);
  console.log('env', env);
  await Promise.all(
    [env.ASSESSMENT_TABLE].map(async (table) => {
      await dynamodb.send(
        new CreateTableCommand({
          TableName: table,
          BillingMode: 'PAY_PER_REQUEST', // on‑demand
          KeySchema: [
            { AttributeName: 'PK', KeyType: 'HASH' },
            { AttributeName: 'SK', KeyType: 'RANGE' },
          ],
          AttributeDefinitions: [
            { AttributeName: 'PK', AttributeType: 'S' },
            { AttributeName: 'SK', AttributeType: 'S' },
          ],
        })
      );
    })
  );
};

createTables()
  .then(() => {
    console.log('DynamoDB tables created.');
  })
  .catch((err) => {
    console.error(err);
  });
