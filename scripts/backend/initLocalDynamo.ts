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
});

const createTables = async () => {
  await Promise.all(
    [
      [env.DDB_TABLE].map(async (table) => {
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
      }),
      [env.ORGANIZATION_TABLE].map(async (table) => {
        await dynamodb.send(
          new CreateTableCommand({
            TableName: table,
            BillingMode: 'PAY_PER_REQUEST', // on‑demand
            KeySchema: [{ AttributeName: 'PK', KeyType: 'HASH' }],
            AttributeDefinitions: [{ AttributeName: 'PK', AttributeType: 'S' }],
          })
        );
      }),
    ].flat()
  );
};

createTables()
  .then(() => {
    console.log('DynamoDB tables created.');
  })
  .catch((err) => {
    console.error(err);
  });
