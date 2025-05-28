import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { Agent } from 'https';
import { DynamoDBClientConfig } from '@aws-sdk/client-dynamodb/dist-types/DynamoDBClient';
import { createInjectionToken, inject } from '@shared/di-container';

const agent = new Agent({
  maxSockets: 25,
});

export type DynamoDBConfig = {
  region: string;
  endpoint?: string;
};

export const defaultDynamoDbConfig: DynamoDBClientConfig = {
  region: process.env.AWS_REGION,
  requestHandler: new NodeHttpHandler({
    requestTimeout: 3000,
    httpsAgent: agent,
  }),
} as const;

export const testDynamoDbConfig: DynamoDBClientConfig = {
  endpoint: 'http://127.0.0.1:8000',
  region: 'us-west-2',
};

export const dynamoDBConfigToken = createInjectionToken<DynamoDBClientConfig>(
  'DynamoDBConfig',
  {
    useValue: defaultDynamoDbConfig,
  }
);

export const dynamoClientToken = createInjectionToken<DynamoDBClient>(
  'DynamoClient',
  {
    useFactory: () => new DynamoDBClient(inject(dynamoDBConfigToken)),
  }
);

export const dynamoDocumentClientToken =
  createInjectionToken<DynamoDBDocumentClient>('DynamoDocumentClient', {
    useFactory: () =>
      DynamoDBDocumentClient.from(inject(dynamoClientToken), {
        marshallOptions: { removeUndefinedValues: true },
      }),
  });
