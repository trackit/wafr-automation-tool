import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';

import { Assessment } from '@backend/models';
import { AssessmentsRepository } from '@backend/ports';
import { createInjectionToken, inject } from '@shared/di-container';

import { tokenLogger } from '../Logger';
import { assertIsDefined } from '@shared/utils';

export class AssessmentsRepositoryDynamoDB implements AssessmentsRepository {
  private readonly client = inject(tokenClientDynamoDB);
  private readonly logger = inject(tokenLogger);
  private readonly tableName = inject(tokenDynamoDBTableName);
  private readonly batchSize = inject(tokenDynamoDBBatchSize);

  private async assessmentExists(args: {
    assessmentId: string;
    organization: string;
  }): Promise<boolean> {
    const { assessmentId, organization } = args;
    const params = {
      TableName: this.tableName,
      Key: {
        PK: { S: organization },
        SK: { S: `ASSESSMENT#${assessmentId}` },
      },
    };

    try {
      const result = await this.client.send(new GetItemCommand(params));
      return !!result.Item;
    } catch (error) {
      this.logger.error('Error checking assessment existence', error);
      throw error;
    }
  }

  public async save(args: {
    assessment: Assessment;
    organization: string;
  }): Promise<Assessment> {
    throw new Error('Not implemented');
  }

  public async getOne(args: {
    assessmentId: string;
    organization: string;
  }): Promise<Assessment | undefined> {
    throw new Error('Not implemented');
  }

  public async delete(args: {
    assessmentId: string;
    organization: string;
  }): Promise<void> {
    throw new Error('Not implemented');
  }

  public async deleteFindings(args: {
    assessmentId: string;
    organization: string;
  }): Promise<void> {
    throw new Error('Not implemented');
  }
}

export const tokenAssessmentsRepository =
  createInjectionToken<AssessmentsRepository>('tokenAssessmentsRepository', {
    useClass: AssessmentsRepositoryDynamoDB,
  });

export const tokenClientDynamoDB = createInjectionToken<DynamoDBClient>(
  'tokenClientDynamoDB',
  { useClass: DynamoDBClient }
);

export const tokenDynamoDBTableName = createInjectionToken<string>(
  'tokenDynamoDBTableName',
  {
    useFactory: () => {
      const tableName = process.env.DDB_TABLE;
      assertIsDefined(tableName, 'DDB_TABLE is not defined');
      return tableName;
    },
  }
);

export const tokenDynamoDBBatchSize = createInjectionToken<number>(
  'tokenDynamoDBBatchSize',
  { useValue: 25 } // Default batch size for DynamoDB operations
);
