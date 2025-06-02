import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClientConfig } from '@aws-sdk/client-dynamodb/dist-types/DynamoDBClient';

import { createInjectionToken, inject } from '@shared/di-container';

export type DynamoDBConfig = {
  region: string;
  endpoint?: string;
};

export const defaultDynamoDbConfig: DynamoDBClientConfig = {
  region: process.env.AWS_REGION,
} as const;

export const testDynamoDbConfig: DynamoDBClientConfig = {
  endpoint: 'http://127.0.0.1:8000',
  region: 'us-west-2',
};

export const tokenDynamoDBConfig = createInjectionToken<DynamoDBClientConfig>(
  'DynamoDBConfig',
  {
    useValue: defaultDynamoDbConfig,
  }
);

export const tokenDynamoDBClient = createInjectionToken<DynamoDBClient>(
  'DynamoDBClient',
  {
    useFactory: () => new DynamoDBClient(inject(tokenDynamoDBConfig)),
  }
);

export const tokenDynamoDBDocument = createInjectionToken<DynamoDBDocument>(
  'DynamoDBDocument',
  {
    useFactory: () =>
      DynamoDBDocument.from(inject(tokenDynamoDBClient), {
        marshallOptions: {
          removeUndefinedValues: true,
        },
      }),
  }
);
