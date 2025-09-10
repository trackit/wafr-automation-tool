import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBClientConfig } from '@aws-sdk/client-dynamodb/dist-types/DynamoDBClient';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';

import { createInjectionToken, inject } from '@shared/di-container';
import { assertIsDefined } from '@shared/utils';

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
          convertEmptyValues: true,
        },
      }),
  }
);

export const tokenDynamoDBAssessmentTableName = createInjectionToken<string>(
  'DynamoDBAssessmentTableName',
  {
    useFactory: () => {
      const tableName = process.env.DDB_TABLE;
      assertIsDefined(tableName, 'DDB_TABLE is not defined');
      return tableName;
    },
  }
);

export const tokenDynamoDBAssessmentBatchSize = createInjectionToken<number>(
  'DynamoDBAssessmentBatchSize',
  { useValue: 25 } // Default batch size for DynamoDB operations
);
