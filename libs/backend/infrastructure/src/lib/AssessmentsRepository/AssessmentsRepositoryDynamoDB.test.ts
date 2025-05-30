import { DeleteItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';

import {
  AssessmentMother,
  AssessmentStep,
  BestPracticeMother,
  FindingMother,
  PillarMother,
  QuestionMother,
  SeverityType,
} from '@backend/models';
import { inject, register, reset } from '@shared/di-container';
import { assertIsDefined } from '@shared/utils';

import { AssessmentsRepositoryDynamoDB } from './AssessmentsRepositoryDynamoDB';
import { registerTestInfrastructure } from '../registerTestInfrastructure';
import {
  tokenDynamoDBClient,
  tokenDynamoDBTableName,
} from '../config/dynamodb/config';

afterEach(async () => {
  const dynamoDBClient = inject(tokenDynamoDBClient);
  const tableName = inject(tokenDynamoDBTableName);

  const scanResult = await dynamoDBClient.send(
    new ScanCommand({ TableName: tableName })
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
        .withCreatedAt(new Date('2023-01-01T00:00:00Z'))
        .withCreatedBy('user1')
        .withExecutionArn(
          'arn:aws:states:us-west-2:123456789012:execution:MyStateMachine:execution1'
        )
        .withFindings([
          PillarMother.basic()
            .withDisabled(false)
            .withId('pillar1')
            .withLabel('Pillar 1')
            .withPrimaryId('primary1')
            .withQuestions([
              QuestionMother.basic()
                .withBestPractices([
                  BestPracticeMother.basic()
                    .withDescription('Best practice 1')
                    .withId('bp1')
                    .withLabel('Best Practice 1')
                    .withPrimaryId('bp1-primary')
                    .withRisk(SeverityType.Medium)
                    .withStatus(true)
                    .build(),
                ])
                .withDisabled(false)
                .withId('question1')
                .withLabel('Question 1')
                .withNone(false)
                .withPrimaryId('question1-primary')
                .build(),
            ])
            .build(),
        ])
        .withId('assessment1')
        .withOrganization('organization1')
        .withName('Test Assessment')
        .withRegions(['us-west-1', 'us-west-2'])
        .withRoleArn('arn:aws:iam::123456789012:role/AssessmentRole')
        .withStep(AssessmentStep.FINISHED)
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

    it('should return undefined if assessment does not exist', async () => {
      const { repository } = setup();

      const fetchedAssessment = await repository.getOne({
        assessmentId: 'assessment1',
        organization: 'organization1',
      });

      expect(fetchedAssessment).toBeUndefined();
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

      const assessment3 = AssessmentMother.basic()
        .withId('assessment2')
        .withOrganization('organization2')
        .build();
      await repository.save(assessment3);

      const fetchedAssessment1 = await repository.getOne({
        assessmentId: 'assessment1',
        organization: 'organization1',
      });
      const fetchedAssessment2 = await repository.getOne({
        assessmentId: 'assessment2',
        organization: 'organization1',
      });

      expect(fetchedAssessment1).toEqual(assessment1);
      expect(fetchedAssessment2).toBeUndefined();
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

      expect(fetchedAssessment).toBeUndefined();
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

      expect(fetchedAssessment1).toBeUndefined();
      expect(fetchedAssessment2).toEqual(assessment2);
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
    it('should save a finding by scanningTool for an assessment by ID and organization', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization1')
        .withFindings([
          PillarMother.basic()
            .withId('0')
            .withQuestions([
              QuestionMother.basic()
                .withId('0')
                .withBestPractices([
                  BestPracticeMother.basic().withId('0').build(),
                ])
                .build(),
            ])
            .build(),
        ])
        .build();
      await repository.save(assessment);

      const finding = FindingMother.basic()
        .withBestPractices('0#0#0')
        .withHidden(false)
        .withId('finding1')
        .withIsAiAssociated(false)
        .withMetadata({ eventCode: 'event1' })
        .withRemediation({
          desc: 'Remediation description',
          references: ['ref1', 'ref2'],
        })
        .withResources([
          {
            name: 'resource1',
            type: 'AWS::EC2::Instance',
            uid: 'resource-id-1',
            region: 'us-west-2',
          },
        ])
        .withRiskDetails('Risk details for finding 1')
        .withSeverity(SeverityType.High)
        .withStatusCode('status-code-1')
        .withStatusDetail('Status detail for finding 1')
        .build();
      await repository.saveFinding({
        assessmentId: 'assessment1',
        organization: 'organization1',
        scanningTool: 'tool1',
        finding,
      });

      const savedFinding = await repository.getOneFinding({
        assessmentId: 'assessment1',
        findingId: 'finding1',
        scanningTool: 'tool1',
        organization: 'organization1',
      });

      expect(savedFinding).toEqual(finding);
    });
  });

  describe('getOneFinding', () => {
    it('should get finding for an assessment by ID and organization', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization1')
        .build();
      await repository.save(assessment);

      const finding = FindingMother.basic().withId('finding1').build();
      await repository.saveFinding({
        assessmentId: 'assessment1',
        organization: 'organization1',
        scanningTool: 'tool1',
        finding,
      });

      const fetchedFinding = await repository.getOneFinding({
        assessmentId: 'assessment1',
        findingId: 'finding1',
        scanningTool: 'tool1',
        organization: 'organization1',
      });

      expect(fetchedFinding).toEqual(finding);
    });

    it('should return undefined if finding does not exist', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization1')
        .build();
      await repository.save(assessment);

      const fetchedFinding = await repository.getOneFinding({
        assessmentId: 'assessment1',
        findingId: 'finding1',
        scanningTool: 'tool1',
        organization: 'organization1',
      });

      expect(fetchedFinding).toBeUndefined();
    });

    it('should be scoped by organization', async () => {
      const { repository } = setup();

      const assessment1 = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization1')
        .build();
      await repository.save(assessment1);

      const assessment2 = AssessmentMother.basic()
        .withId('assessment2')
        .withOrganization('organization2')
        .build();
      await repository.save(assessment2);

      const finding1 = FindingMother.basic().withId('finding1').build();
      await repository.saveFinding({
        assessmentId: 'assessment1',
        organization: 'organization1',
        scanningTool: 'tool1',
        finding: finding1,
      });

      const finding2 = FindingMother.basic().withId('finding2').build();
      await repository.saveFinding({
        assessmentId: 'assessment2',
        organization: 'organization2',
        scanningTool: 'tool2',
        finding: finding2,
      });

      const fetchedFinding1 = await repository.getOneFinding({
        assessmentId: 'assessment1',
        findingId: 'finding1',
        scanningTool: 'tool1',
        organization: 'organization1',
      });
      const fetchedFinding2 = await repository.getOneFinding({
        assessmentId: 'assessment2',
        findingId: 'finding2',
        scanningTool: 'tool2',
        organization: 'organization1',
      });

      expect(fetchedFinding1).toEqual(finding1);
      expect(fetchedFinding2).toBeUndefined();
    });
  });

  describe('deleteFindings', () => {
    it('should delete findings for an assessment by ID and organization', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization1')
        .build();
      await repository.save(assessment);

      const finding1 = FindingMother.basic().withId('finding1').build();
      const finding2 = FindingMother.basic().withId('finding2').build();
      await repository.saveFinding({
        assessmentId: 'assessment1',
        organization: 'organization1',
        scanningTool: 'tool1',
        finding: finding1,
      });
      await repository.saveFinding({
        assessmentId: 'assessment1',
        organization: 'organization1',
        scanningTool: 'tool1',
        finding: finding2,
      });

      await repository.deleteFindings({
        assessmentId: 'assessment1',
        organization: 'organization1',
      });

      const fetchedFinding1 = await repository.getOneFinding({
        assessmentId: 'assessment1',
        findingId: 'finding1',
        scanningTool: 'tool1',
        organization: 'organization1',
      });
      const fetchedFinding2 = await repository.getOneFinding({
        assessmentId: 'assessment1',
        findingId: 'finding2',
        scanningTool: 'tool1',
        organization: 'organization1',
      });

      expect(fetchedFinding1).toBeUndefined();
      expect(fetchedFinding2).toBeUndefined();
    });

    it('should throw an error if the assessment does not exist', async () => {
      const { repository } = setup();

      await expect(
        repository.deleteFindings({
          assessmentId: 'assessment1',
          organization: 'organization1',
        })
      ).rejects.toThrow(Error);
    });

    it('should be scoped by organization', async () => {
      const { repository } = setup();

      const assessment1 = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization1')
        .build();
      await repository.save(assessment1);

      const assessment2 = AssessmentMother.basic()
        .withId('assessment2')
        .withOrganization('organization2')
        .build();
      await repository.save(assessment2);

      const finding1 = FindingMother.basic().withId('finding1').build();
      await repository.saveFinding({
        assessmentId: 'assessment1',
        organization: 'organization1',
        scanningTool: 'tool1',
        finding: finding1,
      });

      const finding2 = FindingMother.basic().withId('finding2').build();
      await repository.saveFinding({
        assessmentId: 'assessment2',
        organization: 'organization2',
        scanningTool: 'tool2',
        finding: finding2,
      });

      await repository.deleteFindings({
        assessmentId: 'assessment1',
        organization: 'organization1',
      });

      const fetchedFinding1 = await repository.getOneFinding({
        assessmentId: 'assessment1',
        findingId: 'finding1',
        scanningTool: 'tool1',
        organization: 'organization1',
      });
      const fetchedFinding2 = await repository.getOneFinding({
        assessmentId: 'assessment2',
        findingId: 'finding2',
        scanningTool: 'tool2',
        organization: 'organization2',
      });

      expect(fetchedFinding1).toBeUndefined();
      expect(fetchedFinding2).toEqual(finding2);
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  register(tokenDynamoDBTableName, {
    useFactory: () => {
      assertIsDefined(
        process.env.ASSESSMENT_TABLE,
        'ASSESSMENT_TABLE is not defined'
      );
      return process.env.ASSESSMENT_TABLE;
    },
  });

  const repository = new AssessmentsRepositoryDynamoDB();
  return { repository };
};
