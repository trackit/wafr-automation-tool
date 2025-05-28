import { mockClient } from 'aws-sdk-client-mock';
import {
  DynamoDBClient,
  GetItemCommand,
  DeleteItemCommand,
  QueryCommand,
  BatchWriteItemCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';

import { inject, register, reset } from '@shared/di-container';

import {
  AssessmentsRepositoryDynamoDB,
  tokenClientDynamoDB,
  tokenDynamoDBTableName,
  tokenDynamoDBBatchSize,
} from './AssessmentsRepositoryDynamoDB';
import { registerTestInfrastructure } from '../registerTestInfrastructure';
import { AssessmentMother } from '@backend/models';

afterEach(async () => {
  const dynamoDBClient = inject(tokenClientDynamoDB);
  const tableName = inject(tokenDynamoDBTableName);

  const scanResult = await dynamoDBClient.send(
    new ScanCommand({
      TableName: tableName,
    })
  );

  await Promise.all(
    (scanResult.Items || []).map(async (item) => {
      await dynamoDBClient.send(
        new DeleteItemCommand({
          TableName: tableName,
          Key: {
            PK: item.PK,
            SK: item.SK,
          },
        })
      );
    })
  );
});

describe('AssessmentsRepositoryDynamoDB', () => {
  describe('save', () => {
    it('should save an assessment to DynamoDB', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization1')
        .withCreatedAt(new Date('2023-01-01T00:00:00Z'))
        .withCreatedBy('user1')
        .withExecutionArn(
          'arn:aws:states:us-west-2:123456789012:execution:MyStateMachine:execution1'
        )
        .withName('Test Assessment')
        .withRegions(['us-west-1', 'us-west-2'])
        .withWorkflows(['workflow-1', 'workflow-2'])
        .build();

      await repository.save(assessment);

      const savedAssessment = await repository.getOne({
        assessmentId: 'assessment1',
        organization: 'organization1',
      });

      expect(savedAssessment).toEqual(assessment);
    });
  });

  describe('getOne', () => {
    it('should get an assessment by ID and organization', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization1')
        .build();

      await repository.save(assessment);

      const fetchedAssessment = await repository.getOne({
        assessmentId: 'assessment1',
        organization: 'organization1',
      });

      expect(fetchedAssessment).toEqual(assessment);
    });

    it('should be scoped by organization', async () => {
      const { repository } = setup();

      const assessment1 = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization1')
        .build();

      await repository.save(assessment1);

      const assessment2 = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization2')
        .build();

      await repository.save(assessment2);

      const fetchedAssessment = await repository.getOne({
        assessmentId: 'assessment1',
        organization: 'organization1',
      });

      expect(fetchedAssessment).toEqual(assessment1);
    });

    it('should return undefined if assessment does not exist', async () => {
      const { repository } = setup();

      const fetchedAssessment = await repository.getOne({
        assessmentId: 'assessment1',
        organization: 'organization1',
      });

      expect(fetchedAssessment).toEqual(undefined);
    });
  });

  describe('delete', () => {
    it('should delete an assessment by ID and organization', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization1')
        .build();

      await repository.save(assessment);

      await repository.delete({
        assessmentId: 'assessment1',
        organization: 'organization1',
      });

      const fetchedAssessment = await repository.getOne({
        assessmentId: 'assessment1',
        organization: 'organization1',
      });

      expect(fetchedAssessment).toEqual(undefined);
    });

    it('should be scoped by organization', async () => {
      const { repository } = setup();

      const assessment1 = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization1')
        .build();
      await repository.save(assessment1);

      const assessment2 = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization2')
        .build();

      await repository.save(assessment2);

      await repository.delete({
        assessmentId: 'assessment1',
        organization: 'organization1',
      });

      const fetchedAssessment1 = await repository.getOne({
        assessmentId: 'assessment1',
        organization: 'organization1',
      });

      const fetchedAssessment2 = await repository.getOne({
        assessmentId: 'assessment1',
        organization: 'organization2',
      });

      expect(fetchedAssessment1).toEqual(undefined);
      expect(fetchedAssessment1).toEqual(assessment2);
    });

    it('should throw an error if the assessment does not exist', async () => {
      const { repository } = setup();

      await expect(
        repository.delete({
          assessmentId: 'assessment1',
          organization: 'organization1',
        })
      ).rejects.toThrow(Error);
    });
  });

  describe('saveFinding', () => {
    it.todo('should save a finding for an assessment by ID and organization');
  });

  describe('getFinding', () => {
    it.todo('should get finding for an assessment by ID and organization');

    it.todo('should be scoped by organization');

    it.todo('should return undefined if finding does not exist');
  });

  describe('deleteFindings', () => {
    it.todo('should delete findings for an assessment by ID and organization');

    it.todo('should be scoped by organization');

    it.todo('should throw an error if the assessment does not exist');
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  register(tokenDynamoDBTableName, {
    useValue: process.env.ASSESSMENT_TABLE!,
  });

  const repository = new AssessmentsRepositoryDynamoDB();
  return { repository };
};
