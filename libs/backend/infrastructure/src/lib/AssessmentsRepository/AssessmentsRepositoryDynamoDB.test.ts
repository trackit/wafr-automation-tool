import { mockClient } from 'aws-sdk-client-mock';
import {
  DynamoDBClient,
  GetItemCommand,
  DeleteItemCommand,
  QueryCommand,
  BatchWriteItemCommand,
} from '@aws-sdk/client-dynamodb';

import { register, reset } from '@shared/di-container';

import {
  AssessmentsRepositoryDynamoDB,
  tokenClientDynamoDB,
  tokenDynamoDBTableName,
  tokenDynamoDBBatchSize,
} from './AssessmentsRepositoryDynamoDB';
import { FakeLogger, tokenLogger } from '../Logger';
import { afterEach } from "vitest";

afterEach(() => {

})

describe('AssessmentsRepositoryDynamoDB', () => {
  describe('save', () => {
    it.todo('should save an assessment to DynamoDB');
  })

  describe('getOne', () => {
    it('should call DynamoDB GetItemCommand with correct parameters', async () => {
      const { repository, dynamoDBClientMock, tableName } = setup();
      const assessmentId = 'assessment-id';
      const organization = 'test.org';

      dynamoDBClientMock.on(GetItemCommand).resolves({});
      await repository.getOne({ assessmentId, organization });

      const calls = dynamoDBClientMock.commandCalls(GetItemCommand);
      expect(calls).toHaveLength(1);
      const call = calls[0];
      expect(call.args[0].input).toEqual({
        TableName: tableName,
        Key: {
          PK: organization,
          SK: `ASSESSMENT#${assessmentId}`,
        },
      });
    });

    it('should return an assessment if it exists', async () => {
      const { repository, dynamoDBClientMock } = setup();
      const assessmentId = 'assessment-id';
      const organization = 'test.org';

      dynamoDBClientMock.on(GetItemCommand).resolves({
        Item: {
          id: { S: assessmentId },
          organization: { S: organization },
          name: { S: 'Test Assessment' },
        },
      });
      const assessment = await repository.getOne({
        assessmentId,
        organization,
      });
      expect(assessment).toEqual(
        expect.objectContaining({
          id: assessmentId,
          organization,
          name: 'Test Assessment',
        })
      );
    });

    it('should return undefined if it does not exist', async () => {
      const { repository, dynamoDBClientMock } = setup();
      const assessmentId = 'non-existent-id';
      const organization = 'test.org';

      dynamoDBClientMock.on(GetItemCommand).resolves({ Item: undefined });
      const assessment = await repository.getOne({
        assessmentId,
        organization,
      });
      expect(assessment).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('should call DynamoDB DeleteItemCommand with correct parameters', async () => {
      const { repository, dynamoDBClientMock, tableName } = setup();
      const assessmentId = 'assessment-id';
      const organization = 'test.org';

      dynamoDBClientMock.on(DeleteItemCommand).resolves({});
      await repository.delete({ assessmentId, organization });

      const calls = dynamoDBClientMock.commandCalls(DeleteItemCommand);
      expect(calls).toHaveLength(1);
      const call = calls[0];
      expect(call.args[0].input).toEqual({
        TableName: tableName,
        Key: {
          PK: organization,
          SK: `ASSESSMENT#${assessmentId}`,
        },
      });
    });

    it('should throw an error if the assessment does not exist', async () => {
      const { repository, dynamoDBClientMock } = setup();
      const assessmentId = 'non-existent-id';
      const organization = 'test.org';

      dynamoDBClientMock.on(GetItemCommand).resolves({ Item: undefined });
      dynamoDBClientMock.on(DeleteItemCommand).resolves({});

      await expect(
        repository.delete({ assessmentId, organization })
      ).rejects.toThrow(Error);
    });
  });

  describe('deleteFindings', () => {
    it('should call QueryCommand then BatchWriteItemCommand until every item is deleted', async () => {
      const { repository, dynamoDBClientMock, tableName } = setup();
      register(tokenDynamoDBBatchSize, { useValue: 2 });
      const assessmentId = 'assessment-id';
      const organization = 'test.org';
      const PK = `${organization}#${assessmentId}`;

      dynamoDBClientMock.on(GetItemCommand).resolves({
        Item: {
          PK: { S: organization },
          SK: { S: `ASSESSMENT#${assessmentId}` },
        },
      });
      dynamoDBClientMock.on(QueryCommand).resolves({
        Items: [
          { PK: { S: PK }, SK: { S: `prowler#1` } },
          { PK: { S: PK }, SK: { S: `prowler#2` } },
        ],
      });
      dynamoDBClientMock.on(BatchWriteItemCommand).resolves({});
      await repository.deleteFindings({ assessmentId, organization });

      const queryCalls = dynamoDBClientMock.commandCalls(QueryCommand);
      expect(queryCalls).toHaveLength(1);
      const queryCall = queryCalls[0];
      expect(queryCall.args[0].input).toEqual({
        TableName: tableName,
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: {
          ':pk': { S: PK },
        },
      });
      const batchWriteCalls = dynamoDBClientMock.commandCalls(
        BatchWriteItemCommand
      );
      expect(batchWriteCalls).toHaveLength(1);
      const batchWriteCall = batchWriteCalls[0];
      expect(batchWriteCall.args[0].input).toEqual({
        RequestItems: {
          [tableName]: [
            {
              DeleteRequest: {
                Key: { PK: { S: PK }, SK: { S: `prowler#1` } },
              },
            },
            {
              DeleteRequest: {
                Key: { PK: { S: PK }, SK: { S: `prowler#2` } },
              },
            },
          ],
        },
      });
    });

    it('should handle empty findings gracefully', async () => {
      const { repository, dynamoDBClientMock } = setup();
      register(tokenDynamoDBBatchSize, { useValue: 2 });
      const assessmentId = 'assessment-id';
      const organization = 'test.org';
      dynamoDBClientMock.on(GetItemCommand).resolves({
        Item: {
          PK: { S: organization },
          SK: { S: `ASSESSMENT#${assessmentId}` },
        },
      });
      dynamoDBClientMock.on(QueryCommand).resolves({ Items: [] });
      dynamoDBClientMock.on(BatchWriteItemCommand).resolves({});

      await expect(
        repository.deleteFindings({ assessmentId, organization })
      ).resolves.not.toThrow();
      const batchWriteCalls = dynamoDBClientMock.commandCalls(
        BatchWriteItemCommand
      );
      expect(batchWriteCalls).toHaveLength(0);
    });

    it('should call several BatchWriteItemCommand if findings exceed batch size', async () => {
      const { repository, dynamoDBClientMock, tableName } = setup();
      register(tokenDynamoDBBatchSize, { useValue: 2 });
      const assessmentId = 'assessment-id';
      const organization = 'test.org';
      const PK = `${organization}#${assessmentId}`;
      dynamoDBClientMock.on(GetItemCommand).resolves({
        Item: {
          PK: { S: organization },
          SK: { S: `ASSESSMENT#${assessmentId}` },
        },
      });
      const findings = new Array(5).fill(null).map((_, i) => ({
        PK: { S: PK },
        SK: { S: `prowler#${i + 1}` },
      }));
      dynamoDBClientMock.on(QueryCommand).resolves({ Items: findings });
      dynamoDBClientMock.on(BatchWriteItemCommand).resolves({});
      await repository.deleteFindings({ assessmentId, organization });

      const batchWriteCalls = dynamoDBClientMock.commandCalls(
        BatchWriteItemCommand
      );
      expect(batchWriteCalls).toHaveLength(3); // 5 findings, batch size is 2, so 3 calls needed
      expect(batchWriteCalls[0].args[0].input).toEqual({
        RequestItems: {
          [tableName]: [
            {
              DeleteRequest: { Key: { PK: { S: PK }, SK: { S: `prowler#1` } } },
            },
            {
              DeleteRequest: { Key: { PK: { S: PK }, SK: { S: `prowler#2` } } },
            },
          ],
        },
      });
      expect(batchWriteCalls[1].args[0].input).toEqual({
        RequestItems: {
          [tableName]: [
            {
              DeleteRequest: { Key: { PK: { S: PK }, SK: { S: `prowler#3` } } },
            },
            {
              DeleteRequest: { Key: { PK: { S: PK }, SK: { S: `prowler#4` } } },
            },
          ],
        },
      });
      expect(batchWriteCalls[2].args[0].input).toEqual({
        RequestItems: {
          [tableName]: [
            {
              DeleteRequest: { Key: { PK: { S: PK }, SK: { S: `prowler#5` } } },
            },
          ],
        },
      });
    });

    it('should throw an error if the assessment does not exist', async () => {
      const { repository, dynamoDBClientMock } = setup();
      const assessmentId = 'non-existent-id';
      const organization = 'test.org';

      dynamoDBClientMock.on(GetItemCommand).resolves({ Item: undefined });
      dynamoDBClientMock.on(QueryCommand).resolves({ Items: [] });
      await expect(
        repository.deleteFindings({ assessmentId, organization })
      ).rejects.toThrow(Error);
    });
  });
});

const setup = () => {
  reset();
  const dynamoDBClientMock = mockClient(DynamoDBClient);
  register(tokenLogger, { useClass: FakeLogger });
  register(tokenClientDynamoDB, { useClass: DynamoDBClient });
  const tableName = 'test-table';
  register(tokenDynamoDBTableName, { useValue: tableName });
  const repository = new AssessmentsRepositoryDynamoDB();
  return { repository, dynamoDBClientMock, tableName };
};
