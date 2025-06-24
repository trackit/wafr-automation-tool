import { DeleteItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';

import {
  AssessmentGraphDataMother,
  AssessmentMother,
  AssessmentStep,
  BestPracticeMother,
  FindingMother,
  PillarMother,
  QuestionMother,
  ScanningTool,
  SeverityType,
} from '@backend/models';
import { inject, register, reset } from '@shared/di-container';
import { assertIsDefined } from '@shared/utils';

import {
  AssessmentNotFoundError,
  BestPracticeNotFoundError,
  EmptyUpdateBodyError,
  FindingNotFoundError,
  InvalidNextTokenError,
  PillarNotFoundError,
  QuestionNotFoundError,
} from '../../Errors';
import { tokenDynamoDBClient } from '../config/dynamodb/config';
import { registerTestInfrastructure } from '../registerTestInfrastructure';
import {
  AssessmentsRepositoryDynamoDB,
  tokenDynamoDBAssessmentTableName,
} from './AssessmentsRepositoryDynamoDB';
import { GetBestPracticeFindingsAssessmentsRepositoryArgsMother } from './GetBestPracticeFindingsAssessmentsRepositoryArgsMother';

afterEach(async () => {
  const dynamoDBClient = inject(tokenDynamoDBClient);
  const tableName = inject(tokenDynamoDBAssessmentTableName);

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
                    .withChecked(true)
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

      const savedAssessment = await repository.get({
        assessmentId: 'assessment1',
        organization: 'organization1',
      });

      expect(savedAssessment).toEqual(assessment);
    });
  });

  describe('getAll', () => {
    it('should return a list of assessment if it exists', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization1')
        .build();

      await repository.save(assessment);

      const fetchedAssessments = await repository.getAll({
        organization: 'organization1',
      });

      expect(fetchedAssessments).toEqual({
        assessments: [assessment],
        nextToken: undefined,
      });
    });

    it('should return all assessments with matched search criteria', async () => {
      const { repository } = setup();

      const assessment1 = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization1')
        .build();

      await repository.save(assessment1);

      const assessment2 = AssessmentMother.basic()
        .withId('assessment2')
        .withOrganization('organization1')
        .build();

      await repository.save(assessment2);

      const fetchedAssessments = await repository.getAll({
        organization: 'organization1',
        search: 'assessment1',
      });

      expect(fetchedAssessments).toEqual({
        assessments: [assessment1],
        nextToken: undefined,
      });
    });

    it('should return all assessments within the limit', async () => {
      const { repository } = setup();

      const assessment1 = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization1')
        .build();

      await repository.save(assessment1);

      const assessment2 = AssessmentMother.basic()
        .withId('assessment2')
        .withOrganization('organization1')
        .build();

      await repository.save(assessment2);

      const fetchedAssessments = await repository.getAll({
        organization: 'organization1',
        limit: 1,
      });

      expect(fetchedAssessments).toEqual({
        assessments: [expect.objectContaining({ id: 'assessment2' })],
        nextToken: expect.any(String),
      });
    });

    it('should return all assessments after the next token', async () => {
      const { repository } = setup();

      const assessment1 = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization1')
        .build();

      await repository.save(assessment1);

      const assessment2 = AssessmentMother.basic()
        .withId('assessment2')
        .withOrganization('organization1')
        .build();

      await repository.save(assessment2);

      const nextTokenAssessment = {
        PK: 'organization1',
        SK: 'ASSESSMENT#assessment2',
      };
      const nextToken =
        AssessmentsRepositoryDynamoDB.encodeNextToken(nextTokenAssessment);

      const fetchedAssessments = await repository.getAll({
        organization: 'organization1',
        nextToken: nextToken,
      });

      expect(fetchedAssessments).toEqual({
        assessments: [assessment1],
        nextToken: undefined,
      });
    });

    it('should return an empty list if assessments does not match the organization', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization1')
        .build();

      await repository.save(assessment);

      const fetchedAssessments = await repository.getAll({
        organization: 'organization2',
      });

      expect(fetchedAssessments).toEqual({
        assessments: [],
        nextToken: undefined,
      });
    });

    it('should return an empty list if no assessments', async () => {
      const { repository } = setup();

      const fetchedAssessments = await repository.getAll({
        organization: 'organization1',
      });

      expect(fetchedAssessments).toEqual({
        assessments: [],
        nextToken: undefined,
      });
    });
  });

  describe('get', () => {
    it('should get an assessment by ID and organization', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization1')
        .build();

      await repository.save(assessment);

      const fetchedAssessment = await repository.get({
        assessmentId: 'assessment1',
        organization: 'organization1',
      });

      expect(fetchedAssessment).toEqual(assessment);
    });

    it('should return undefined if assessment does not exist', async () => {
      const { repository } = setup();

      const fetchedAssessment = await repository.get({
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

      const fetchedAssessment1 = await repository.get({
        assessmentId: 'assessment1',
        organization: 'organization1',
      });
      const fetchedAssessment2 = await repository.get({
        assessmentId: 'assessment2',
        organization: 'organization1',
      });

      expect(fetchedAssessment1).toEqual(assessment1);
      expect(fetchedAssessment2).toBeUndefined();
    });
  });

  describe('updateBestPractice', () => {
    it('should update the best practice status', async () => {
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
                  BestPracticeMother.basic()
                    .withId('0')
                    .withChecked(false)
                    .build(),
                ])
                .build(),
            ])
            .build(),
        ])
        .build();
      await repository.save(assessment);

      await expect(
        repository.updateBestPractice({
          assessmentId: 'assessment1',
          organization: 'organization1',
          pillarId: '0',
          questionId: '0',
          bestPracticeId: '0',
          bestPracticeBody: {
            checked: true,
          },
        })
      ).resolves.not.toThrow();
      const updatedAssessment = await repository.get({
        assessmentId: 'assessment1',
        organization: 'organization1',
      });
      expect(
        updatedAssessment?.findings?.[0].questions?.[0].bestPractices?.[0]
          .checked
      ).toBe(true);
    });

    it('should throw AssessmentNotFound if the assessment does not exist', async () => {
      const { repository } = setup();

      await expect(
        repository.updateBestPractice({
          assessmentId: 'assessment1',
          organization: 'organization1',
          pillarId: '0',
          questionId: '0',
          bestPracticeId: '0',
          bestPracticeBody: {},
        })
      ).rejects.toThrow(AssessmentNotFoundError);
    });

    it('should throw AssessmentNotFound if assessment exist for another organization', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization2')
        .withFindings([
          PillarMother.basic()
            .withId('0')
            .withQuestions([
              QuestionMother.basic()
                .withId('0')
                .withBestPractices([
                  BestPracticeMother.basic()
                    .withId('0')
                    .withChecked(false)
                    .build(),
                ])
                .build(),
            ])
            .build(),
        ])
        .build();
      await repository.save(assessment);

      await expect(
        repository.updateBestPractice({
          assessmentId: 'assessment1',
          organization: 'organization1',
          pillarId: '0',
          questionId: '0',
          bestPracticeId: '0',
          bestPracticeBody: {},
        })
      ).rejects.toThrow(AssessmentNotFoundError);
    });

    it('should throw PillarNotFoundError if the pillar doesn’t exist in the assessment', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization1')
        .withFindings([])
        .build();
      await repository.save(assessment);

      await expect(
        repository.updateBestPractice({
          assessmentId: 'assessment1',
          organization: 'organization1',
          pillarId: '0',
          questionId: '0',
          bestPracticeId: '0',
          bestPracticeBody: {},
        })
      ).rejects.toThrow(PillarNotFoundError);
    });

    it('should throw QuestionNotFoundError if the question doesn’t exist in the assessment', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization1')
        .withFindings([
          PillarMother.basic().withId('0').withQuestions([]).build(),
        ])
        .build();
      await repository.save(assessment);

      await expect(
        repository.updateBestPractice({
          assessmentId: 'assessment1',
          organization: 'organization1',
          pillarId: '0',
          questionId: '0',
          bestPracticeId: '0',
          bestPracticeBody: {},
        })
      ).rejects.toThrow(QuestionNotFoundError);
    });

    it('should throw BestPracticeNotFoundError if the best practice doesn’t exist in the assessment', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization1')
        .withFindings([
          PillarMother.basic()
            .withId('0')
            .withQuestions([
              QuestionMother.basic().withId('0').withBestPractices([]).build(),
            ])
            .build(),
        ])
        .build();
      await repository.save(assessment);

      await expect(
        repository.updateBestPractice({
          assessmentId: 'assessment1',
          organization: 'organization1',
          pillarId: '0',
          questionId: '0',
          bestPracticeId: '0',
          bestPracticeBody: {},
        })
      ).rejects.toThrow(BestPracticeNotFoundError);
    });

    it('should throw EmptyUpdateBodyError if bestPracticeBody is empty', async () => {
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
                  BestPracticeMother.basic()
                    .withId('0')
                    .withChecked(false)
                    .build(),
                ])
                .build(),
            ])
            .build(),
        ])
        .build();
      await repository.save(assessment);

      await expect(
        repository.updateBestPractice({
          assessmentId: 'assessment1',
          organization: 'organization1',
          pillarId: '0',
          questionId: '0',
          bestPracticeId: '0',
          bestPracticeBody: {},
        })
      ).rejects.toThrow(EmptyUpdateBodyError);
    });
  });

  describe('updatePillar', () => {
    it('should update the pillar disabled status', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization1')
        .withFindings([
          PillarMother.basic().withId('0').withDisabled(false).build(),
        ])
        .build();
      await repository.save(assessment);

      await expect(
        repository.updatePillar({
          assessmentId: 'assessment1',
          organization: 'organization1',
          pillarId: '0',
          pillarBody: {
            disabled: true,
          },
        })
      ).resolves.not.toThrow();
      const updatedAssessment = await repository.get({
        assessmentId: 'assessment1',
        organization: 'organization1',
      });
      expect(updatedAssessment?.findings?.[0].disabled).toBe(true);
    });

    it('should throw AssessmentNotFound if the assessment does not exist', async () => {
      const { repository } = setup();

      await expect(
        repository.updatePillar({
          assessmentId: 'assessment1',
          organization: 'organization1',
          pillarId: '0',
          pillarBody: {},
        })
      ).rejects.toThrow(AssessmentNotFoundError);
    });

    it('should throw AssessmentNotFound if assessment exist for another organization', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization2')
        .build();
      await repository.save(assessment);

      await expect(
        repository.updatePillar({
          assessmentId: 'assessment1',
          organization: 'organization1',
          pillarId: '0',
          pillarBody: {},
        })
      ).rejects.toThrow(AssessmentNotFoundError);
    });

    it('should throw PillarNotFoundError if the pillar doesn’t exist in the assessment', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization1')
        .withFindings([])
        .build();
      await repository.save(assessment);

      await expect(
        repository.updatePillar({
          assessmentId: 'assessment1',
          organization: 'organization1',
          pillarId: '0',
          pillarBody: {},
        })
      ).rejects.toThrow(PillarNotFoundError);
    });

    it('should throw EmptyUpdateBodyError if pillarBody is empty', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization1')
        .withFindings([PillarMother.basic().withId('0').build()])
        .build();
      await repository.save(assessment);

      await expect(
        repository.updatePillar({
          assessmentId: 'assessment1',
          organization: 'organization1',
          pillarId: '0',
          pillarBody: {},
        })
      ).rejects.toThrow(EmptyUpdateBodyError);
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

      const fetchedAssessment = await repository.get({
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

      const fetchedAssessment1 = await repository.get({
        assessmentId: 'assessment1',
        organization: 'organization1',
      });

      const fetchedAssessment2 = await repository.get({
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
        .withId('scanningTool#1')
        .withBestPractices('0#0#0')
        .withHidden(false)
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
        finding,
      });

      const savedFinding = await repository.getFinding({
        assessmentId: 'assessment1',
        findingId: 'scanningTool#1',
        organization: 'organization1',
      });

      expect(savedFinding).toEqual(finding);
    });
  });

  describe('getFinding', () => {
    it('should get finding for an assessment by ID and organization', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization1')
        .build();
      await repository.save(assessment);

      const finding = FindingMother.basic().withId('scanningTool#1').build();
      await repository.saveFinding({
        assessmentId: 'assessment1',
        organization: 'organization1',
        finding,
      });

      const fetchedFinding = await repository.getFinding({
        assessmentId: 'assessment1',
        findingId: 'scanningTool#1',
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

      const fetchedFinding = await repository.getFinding({
        assessmentId: 'assessment1',
        findingId: 'scanningTool#1',
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

      const finding1 = FindingMother.basic().withId('scanningTool#1').build();
      await repository.saveFinding({
        assessmentId: 'assessment1',
        organization: 'organization1',
        finding: finding1,
      });

      const finding2 = FindingMother.basic().withId('scanningTool#2').build();
      await repository.saveFinding({
        assessmentId: 'assessment2',
        organization: 'organization2',
        finding: finding2,
      });

      const fetchedFinding1 = await repository.getFinding({
        assessmentId: 'assessment1',
        findingId: 'scanningTool#1',
        organization: 'organization1',
      });
      const fetchedFinding2 = await repository.getFinding({
        assessmentId: 'assessment2',
        findingId: 'scanningTool#2',
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

      const finding1 = FindingMother.basic().withId('scanningTool#1').build();
      const finding2 = FindingMother.basic().withId('scanningTool#2').build();
      await repository.saveFinding({
        assessmentId: 'assessment1',
        organization: 'organization1',
        finding: finding1,
      });
      await repository.saveFinding({
        assessmentId: 'assessment1',
        organization: 'organization1',
        finding: finding2,
      });

      await repository.deleteFindings({
        assessmentId: 'assessment1',
        organization: 'organization1',
      });

      const fetchedFinding1 = await repository.getFinding({
        assessmentId: 'assessment1',
        findingId: 'scanningTool#1',
        organization: 'organization1',
      });
      const fetchedFinding2 = await repository.getFinding({
        assessmentId: 'assessment1',
        findingId: 'scanningTool#2',
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

      const finding1 = FindingMother.basic().withId('scanningTool#1').build();
      await repository.saveFinding({
        assessmentId: 'assessment1',
        organization: 'organization1',
        finding: finding1,
      });

      const finding2 = FindingMother.basic().withId('scanningTool#2').build();
      await repository.saveFinding({
        assessmentId: 'assessment2',
        organization: 'organization2',
        finding: finding2,
      });

      await repository.deleteFindings({
        assessmentId: 'assessment1',
        organization: 'organization1',
      });

      const fetchedFinding1 = await repository.getFinding({
        assessmentId: 'assessment1',
        findingId: 'scanningTool#1',
        organization: 'organization1',
      });
      const fetchedFinding2 = await repository.getFinding({
        assessmentId: 'assessment2',
        findingId: 'scanningTool#2',
        organization: 'organization2',
      });

      expect(fetchedFinding1).toBeUndefined();
      expect(fetchedFinding2).toEqual(finding2);
    });
  });

  describe('nextToken validation', () => {
    it('should throw an error if the next token is invalid', async () => {
      const { repository } = setup();

      const nextToken = 'test-token';

      await expect(
        repository.getAll({
          organization: 'organization1',
          nextToken,
        })
      ).rejects.toThrow(InvalidNextTokenError);
    });
  });

  describe('update', () => {
    it('should update the assessment', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization1')
        .withName('Old Name')
        .withFindings([])
        .withQuestionVersion('0.1')
        .withRawGraphData({
          [ScanningTool.PROWLER]: {
            findings: 0,
            regions: {},
            resourceTypes: {},
            severities: {},
          },
        })
        .build();
      await repository.save(assessment);

      await repository.update({
        assessmentId: 'assessment1',
        organization: 'organization1',
        assessmentBody: {
          name: 'New Name',
          findings: [
            PillarMother.basic()
              .withId('pillar-1')
              .withQuestions([
                QuestionMother.basic()
                  .withId('question-1')
                  .withBestPractices([
                    BestPracticeMother.basic()
                      .withId('best-practice-1')
                      .withResults(['prowler#1'])
                      .build(),
                  ])
                  .build(),
              ])
              .build(),
          ],
          questionVersion: '1.0',
          rawGraphData: {
            [ScanningTool.PROWLER]: {
              findings: 1,
              regions: { 'us-west-2': 1 },
              resourceTypes: { 'aws-ec2': 1 },
              severities: { [SeverityType.High]: 1 },
            },
          },
        },
      });

      const updatedAssessment = await repository.get({
        assessmentId: 'assessment1',
        organization: 'organization1',
      });

      expect(updatedAssessment).toEqual(
        expect.objectContaining({
          name: 'New Name',
          findings: [
            expect.objectContaining({
              id: 'pillar-1',
              questions: [
                expect.objectContaining({
                  id: 'question-1',
                  bestPractices: [
                    expect.objectContaining({
                      id: 'best-practice-1',
                      results: ['prowler#1'],
                    }),
                  ],
                }),
              ],
            }),
          ],
          questionVersion: '1.0',
          rawGraphData: {
            [ScanningTool.PROWLER]: {
              findings: 1,
              regions: { 'us-west-2': 1 },
              resourceTypes: { 'aws-ec2': 1 },
              severities: { [SeverityType.High]: 1 },
            },
          },
        })
      );
    });

    it('should throw a EmptyUpdateBodyError in case of empty assessment body', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization1')
        .withName('Old Name')
        .build();
      await repository.save(assessment);

      await expect(
        repository.update({
          assessmentId: 'assessment1',
          organization: 'organization1',
          assessmentBody: {},
        })
      ).rejects.toThrow(EmptyUpdateBodyError);
    });

    it('should throw an error if the assessment does not exist', async () => {
      const { repository } = setup();

      await expect(
        repository.update({
          assessmentId: 'assessment1',
          organization: 'organization1',
          assessmentBody: { name: 'New Name' },
        })
      ).rejects.toThrow(AssessmentNotFoundError);
    });

    it('should be scoped by organization', async () => {
      const { repository } = setup();

      const assessment1 = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization1')
        .withName('Old Name')
        .build();
      await repository.save(assessment1);

      const assessment2 = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization2')
        .withName('Old Name')
        .build();
      await repository.save(assessment2);

      await repository.update({
        assessmentId: 'assessment1',
        organization: 'organization1',
        assessmentBody: { name: 'New Name' },
      });

      const updatedAssessment1 = await repository.get({
        assessmentId: 'assessment1',
        organization: 'organization1',
      });
      const updatedAssessment2 = await repository.get({
        assessmentId: 'assessment1',
        organization: 'organization2',
      });

      expect(updatedAssessment1).toEqual(
        expect.objectContaining({ name: 'New Name' })
      );
      expect(updatedAssessment2).toEqual(
        expect.objectContaining({ name: 'Old Name' })
      );
    });
  });

  describe('getBestPracticeFindings', () => {
    it('should return all findings', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization1')
        .withFindings([
          PillarMother.basic()
            .withId('pillar1')
            .withQuestions([
              QuestionMother.basic()
                .withId('question1')
                .withBestPractices([
                  BestPracticeMother.basic().withId('bp1').build(),
                ])
                .build(),
            ])
            .build(),
        ])
        .build();
      await repository.save(assessment);

      const finding1 = FindingMother.basic()
        .withBestPractices('pillar1#question1#bp1')
        .withId('tool#1')
        .build();
      const finding2 = FindingMother.basic()
        .withBestPractices('pillar1#question1#bp1')
        .withId('tool#2')
        .build();
      await repository.saveFinding({
        assessmentId: 'assessment1',
        organization: 'organization1',
        finding: finding1,
      });
      await repository.saveFinding({
        assessmentId: 'assessment1',
        organization: 'organization1',
        finding: finding2,
      });

      const { findings } = await repository.getBestPracticeFindings(
        GetBestPracticeFindingsAssessmentsRepositoryArgsMother.basic()
          .withAssessmentId('assessment1')
          .withOrganization('organization1')
          .withPillarId('pillar1')
          .withQuestionId('question1')
          .withBestPracticeId('bp1')
          .build()
      );

      expect(findings).toEqual([
        expect.objectContaining({ id: 'tool#1' }),
        expect.objectContaining({ id: 'tool#2' }),
      ]);
    });

    it('should be scoped by organization', async () => {
      const { repository } = setup();
      const assessment1 = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization1')
        .withFindings([
          PillarMother.basic()
            .withId('pillar1')
            .withQuestions([
              QuestionMother.basic()
                .withId('question1')
                .withBestPractices([
                  BestPracticeMother.basic().withId('bp1').build(),
                ])
                .build(),
            ])
            .build(),
        ])
        .build();
      await repository.save(assessment1);
      const assessment2 = AssessmentMother.basic()
        .withId('assessment2')
        .withOrganization('organization2')
        .withFindings([
          PillarMother.basic()
            .withId('pillar1')
            .withQuestions([
              QuestionMother.basic()
                .withId('question1')
                .withBestPractices([
                  BestPracticeMother.basic().withId('bp1').build(),
                ])
                .build(),
            ])
            .build(),
        ])
        .build();
      await repository.save(assessment2);

      const finding1 = FindingMother.basic()
        .withBestPractices('pillar1#question1#bp1')
        .withId('tool#1')
        .build();
      const finding2 = FindingMother.basic()
        .withBestPractices('pillar1#question1#bp1')
        .withId('tool#1')
        .build();
      await repository.saveFinding({
        assessmentId: 'assessment1',
        organization: 'organization1',
        finding: finding1,
      });
      await repository.saveFinding({
        assessmentId: 'assessment2',
        organization: 'organization2',
        finding: finding2,
      });
      const { findings } = await repository.getBestPracticeFindings(
        GetBestPracticeFindingsAssessmentsRepositoryArgsMother.basic()
          .withAssessmentId('assessment1')
          .withOrganization('organization1')
          .withPillarId('pillar1')
          .withQuestionId('question1')
          .withBestPracticeId('bp1')
          .build()
      );

      expect(findings).toEqual([expect.objectContaining({ id: 'tool#1' })]);
    });

    it('should return an empty array if no findings exist', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization1')
        .withFindings([
          PillarMother.basic()
            .withId('pillar1')
            .withQuestions([
              QuestionMother.basic()
                .withId('question1')
                .withBestPractices([
                  BestPracticeMother.basic().withId('bp1').build(),
                ])
                .build(),
            ])
            .build(),
        ])
        .build();
      await repository.save(assessment);

      const { findings } = await repository.getBestPracticeFindings(
        GetBestPracticeFindingsAssessmentsRepositoryArgsMother.basic()
          .withAssessmentId('assessment1')
          .withOrganization('organization1')
          .withPillarId('pillar1')
          .withQuestionId('question1')
          .withBestPracticeId('bp1')
          .build()
      );

      expect(findings).toEqual([]);
    });

    it('should throw an error if the pillar does not exist', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization1')
        .withFindings([])
        .build();
      await repository.save(assessment);

      await expect(
        repository.getBestPracticeFindings(
          GetBestPracticeFindingsAssessmentsRepositoryArgsMother.basic()
            .withAssessmentId('assessment1')
            .withOrganization('organization1')
            .withPillarId('pillar1')
            .withQuestionId('question1')
            .withBestPracticeId('bp1')
            .build()
        )
      ).rejects.toThrow(PillarNotFoundError);
    });

    it('should throw an error if the question does not exist', async () => {
      const { repository } = setup();
      const assessment = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization1')
        .withFindings([
          PillarMother.basic().withId('pillar1').withQuestions([]).build(),
        ])
        .build();
      await repository.save(assessment);

      await expect(
        repository.getBestPracticeFindings(
          GetBestPracticeFindingsAssessmentsRepositoryArgsMother.basic()
            .withAssessmentId('assessment1')
            .withOrganization('organization1')
            .withPillarId('pillar1')
            .withQuestionId('question1')
            .withBestPracticeId('bp1')
            .build()
        )
      ).rejects.toThrow(QuestionNotFoundError);
    });

    it('should throw an error if the best practice does not exist', async () => {
      const { repository } = setup();
      const assessment = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization1')
        .withFindings([
          PillarMother.basic()
            .withId('pillar1')
            .withQuestions([
              QuestionMother.basic()
                .withId('question1')
                .withBestPractices([])
                .build(),
            ])
            .build(),
        ])
        .build();
      await repository.save(assessment);
      await expect(
        repository.getBestPracticeFindings(
          GetBestPracticeFindingsAssessmentsRepositoryArgsMother.basic()
            .withAssessmentId('assessment1')
            .withOrganization('organization1')
            .withPillarId('pillar1')
            .withQuestionId('question1')
            .withBestPracticeId('bp1')
            .build()
        )
      ).rejects.toThrow(BestPracticeNotFoundError);
    });

    it('should not return the hidden findings', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization1')
        .withFindings([
          PillarMother.basic()
            .withId('pillar1')
            .withQuestions([
              QuestionMother.basic()
                .withId('question1')
                .withBestPractices([
                  BestPracticeMother.basic().withId('bp1').build(),
                ])
                .build(),
            ])
            .build(),
        ])
        .build();
      await repository.save(assessment);

      const finding1 = FindingMother.basic()
        .withBestPractices('pillar1#question1#bp1')
        .withId('tool#1')
        .withHidden(false)
        .build();
      const finding2 = FindingMother.basic()
        .withBestPractices('pillar1#question1#bp1')
        .withId('tool#2')
        .withHidden(true)
        .build();
      await repository.saveFinding({
        assessmentId: 'assessment1',
        organization: 'organization1',
        finding: finding1,
      });
      await repository.saveFinding({
        assessmentId: 'assessment1',
        organization: 'organization1',
        finding: finding2,
      });

      const { findings } = await repository.getBestPracticeFindings(
        GetBestPracticeFindingsAssessmentsRepositoryArgsMother.basic()
          .withAssessmentId('assessment1')
          .withOrganization('organization1')
          .withPillarId('pillar1')
          .withQuestionId('question1')
          .withBestPracticeId('bp1')
          .build()
      );

      expect(findings).toEqual([expect.objectContaining({ id: 'tool#1' })]);
    });

    it('should only return the matching findings', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization1')
        .withFindings([
          PillarMother.basic()
            .withId('pillar1')
            .withQuestions([
              QuestionMother.basic()
                .withId('question1')
                .withBestPractices([
                  BestPracticeMother.basic().withId('bp1').build(),
                ])
                .build(),
            ])
            .build(),
        ])
        .build();
      await repository.save(assessment);

      const finding1 = FindingMother.basic()
        .withBestPractices('pillar1#question1#bp1')
        .withId('tool#1')
        .withRiskDetails('dummy risk details')
        .withStatusDetail('dummy status detail')
        .build();
      const finding2 = FindingMother.basic()
        .withBestPractices('pillar1#question1#bp1')
        .withId('tool#2')
        .withStatusDetail('searchterm')
        .build();
      const finding3 = FindingMother.basic()
        .withBestPractices('pillar1#question1#bp1')
        .withId('tool#3')
        .withRiskDetails('searchterm')
        .build();
      await repository.saveFinding({
        assessmentId: 'assessment1',
        organization: 'organization1',
        finding: finding1,
      });
      await repository.saveFinding({
        assessmentId: 'assessment1',
        organization: 'organization1',
        finding: finding2,
      });
      await repository.saveFinding({
        assessmentId: 'assessment1',
        organization: 'organization1',
        finding: finding3,
      });

      const { findings } = await repository.getBestPracticeFindings(
        GetBestPracticeFindingsAssessmentsRepositoryArgsMother.basic()
          .withAssessmentId('assessment1')
          .withOrganization('organization1')
          .withPillarId('pillar1')
          .withQuestionId('question1')
          .withBestPracticeId('bp1')
          .withSearchTerm('searchterm')
          .build()
      );

      expect(findings).toEqual([
        expect.objectContaining({ id: 'tool#2' }),
        expect.objectContaining({ id: 'tool#3' }),
      ]);
    });

    it('should only return a limited number of findings', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization1')
        .withFindings([
          PillarMother.basic()
            .withId('pillar1')
            .withQuestions([
              QuestionMother.basic()
                .withId('question1')
                .withBestPractices([
                  BestPracticeMother.basic().withId('bp1').build(),
                ])
                .build(),
            ])
            .build(),
        ])
        .build();
      await repository.save(assessment);

      const finding1 = FindingMother.basic()
        .withBestPractices('pillar1#question1#bp1')
        .withId('tool#1')
        .build();
      const finding2 = FindingMother.basic()
        .withBestPractices('pillar1#question1#bp1')
        .withId('tool#2')
        .build();
      const finding3 = FindingMother.basic()
        .withBestPractices('pillar1#question1#bp1')
        .withId('tool#3')
        .build();
      await repository.saveFinding({
        assessmentId: 'assessment1',
        organization: 'organization1',
        finding: finding1,
      });
      await repository.saveFinding({
        assessmentId: 'assessment1',
        organization: 'organization1',
        finding: finding2,
      });
      await repository.saveFinding({
        assessmentId: 'assessment1',
        organization: 'organization1',
        finding: finding3,
      });

      const { findings } = await repository.getBestPracticeFindings(
        GetBestPracticeFindingsAssessmentsRepositoryArgsMother.basic()
          .withAssessmentId('assessment1')
          .withOrganization('organization1')
          .withPillarId('pillar1')
          .withQuestionId('question1')
          .withBestPracticeId('bp1')
          .withLimit(2)
          .build()
      );

      expect(findings).toEqual([
        expect.objectContaining({ id: 'tool#1' }),
        expect.objectContaining({ id: 'tool#2' }),
      ]);
    });

    it('should also return the hidden findings', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization1')
        .withFindings([
          PillarMother.basic()
            .withId('pillar1')
            .withQuestions([
              QuestionMother.basic()
                .withId('question1')
                .withBestPractices([
                  BestPracticeMother.basic().withId('bp1').build(),
                ])
                .build(),
            ])
            .build(),
        ])
        .build();
      await repository.save(assessment);

      const finding1 = FindingMother.basic()
        .withBestPractices('pillar1#question1#bp1')
        .withId('tool#1')
        .withHidden(false)
        .build();
      const finding2 = FindingMother.basic()
        .withBestPractices('pillar1#question1#bp1')
        .withId('tool#2')
        .withHidden(true)
        .build();
      await repository.saveFinding({
        assessmentId: 'assessment1',
        organization: 'organization1',
        finding: finding1,
      });
      await repository.saveFinding({
        assessmentId: 'assessment1',
        organization: 'organization1',
        finding: finding2,
      });

      const { findings } = await repository.getBestPracticeFindings(
        GetBestPracticeFindingsAssessmentsRepositoryArgsMother.basic()
          .withAssessmentId('assessment1')
          .withOrganization('organization1')
          .withPillarId('pillar1')
          .withQuestionId('question1')
          .withBestPracticeId('bp1')
          .withShowHidden(true)
          .build()
      );

      expect(findings).toEqual([
        expect.objectContaining({ id: 'tool#1' }),
        expect.objectContaining({ id: 'tool#2' }),
      ]);
    });

    it('should return a nextToken if more results are available', async () => {
      const { repository } = setup();
      const assessment = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization1')
        .withFindings([
          PillarMother.basic()
            .withId('pillar1')
            .withQuestions([
              QuestionMother.basic()
                .withId('question1')
                .withBestPractices([
                  BestPracticeMother.basic().withId('bp1').build(),
                ])
                .build(),
            ])
            .build(),
        ])
        .build();
      await repository.save(assessment);
      const finding1 = FindingMother.basic()
        .withBestPractices('pillar1#question1#bp1')
        .withId('tool#1')
        .build();
      const finding2 = FindingMother.basic()
        .withBestPractices('pillar1#question1#bp1')
        .withId('tool#2')
        .build();
      await repository.saveFinding({
        assessmentId: 'assessment1',
        organization: 'organization1',
        finding: finding1,
      });
      await repository.saveFinding({
        assessmentId: 'assessment1',
        organization: 'organization1',
        finding: finding2,
      });

      const { nextToken } = await repository.getBestPracticeFindings(
        GetBestPracticeFindingsAssessmentsRepositoryArgsMother.basic()
          .withAssessmentId('assessment1')
          .withOrganization('organization1')
          .withPillarId('pillar1')
          .withQuestionId('question1')
          .withBestPracticeId('bp1')
          .withLimit(1)
          .build()
      );
      expect(nextToken).toBeDefined();
    });

    it('should return more results using nextToken', async () => {
      const { repository } = setup();
      const assessment = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization1')
        .withFindings([
          PillarMother.basic()
            .withId('pillar1')
            .withQuestions([
              QuestionMother.basic()
                .withId('question1')
                .withBestPractices([
                  BestPracticeMother.basic().withId('bp1').build(),
                ])
                .build(),
            ])
            .build(),
        ])
        .build();
      await repository.save(assessment);
      const finding1 = FindingMother.basic()
        .withBestPractices('pillar1#question1#bp1')
        .withId('tool#1')
        .build();
      const finding2 = FindingMother.basic()
        .withBestPractices('pillar1#question1#bp1')
        .withId('tool#2')
        .build();
      await repository.saveFinding({
        assessmentId: 'assessment1',
        organization: 'organization1',
        finding: finding1,
      });
      await repository.saveFinding({
        assessmentId: 'assessment1',
        organization: 'organization1',
        finding: finding2,
      });

      const { findings: firstFindings, nextToken } =
        await repository.getBestPracticeFindings(
          GetBestPracticeFindingsAssessmentsRepositoryArgsMother.basic()
            .withAssessmentId('assessment1')
            .withOrganization('organization1')
            .withPillarId('pillar1')
            .withQuestionId('question1')
            .withBestPracticeId('bp1')
            .withLimit(1)
            .build()
        );
      const { findings: secondFindings } =
        await repository.getBestPracticeFindings(
          GetBestPracticeFindingsAssessmentsRepositoryArgsMother.basic()
            .withAssessmentId('assessment1')
            .withOrganization('organization1')
            .withPillarId('pillar1')
            .withQuestionId('question1')
            .withBestPracticeId('bp1')
            .withNextToken(nextToken as string)
            .build()
        );

      expect(firstFindings).not.toEqual(secondFindings);
      expect(firstFindings.length).toBe(1);
      expect(secondFindings.length).toBe(1);
    });
  });

  describe('updateFinding', () => {
    it('should update the finding visibility', async () => {
      const { repository } = setup();

      const finding = FindingMother.basic()
        .withId('tool#1')
        .withHidden(false)
        .build();
      await repository.saveFinding({
        assessmentId: 'assessment1',
        organization: 'organization1',
        finding,
      });

      await repository.updateFinding({
        assessmentId: 'assessment1',
        organization: 'organization1',
        findingId: 'tool#1',
        findingBody: {
          hidden: true,
        },
      });

      const fetchedFinding = await repository.getFinding({
        assessmentId: 'assessment1',
        findingId: 'tool#1',
        organization: 'organization1',
      });

      expect(fetchedFinding).toEqual(
        expect.objectContaining({
          id: 'tool#1',
          hidden: true,
        })
      );
    });

    it('should throw a EmptyUpdateBodyError in case of empty finding body', async () => {
      const { repository } = setup();

      const finding = FindingMother.basic().withId('tool#1').build();
      await repository.saveFinding({
        assessmentId: 'assessment1',
        organization: 'organization1',
        finding,
      });

      await expect(
        repository.updateFinding({
          assessmentId: 'assessment1',
          organization: 'organization1',
          findingId: 'tool#1',
          findingBody: {},
        })
      ).rejects.toThrow(EmptyUpdateBodyError);
    });

    it('should throw an error if the finding does not exist', async () => {
      const { repository } = setup();

      await expect(
        repository.updateFinding({
          assessmentId: 'assessment1',
          organization: 'organization1',
          findingId: 'tool#1',
          findingBody: {
            hidden: true,
          },
        })
      ).rejects.toThrow(FindingNotFoundError);
    });

    it('should be scoped by organization', async () => {
      const { repository } = setup();

      const finding1 = FindingMother.basic()
        .withId('tool#1')
        .withHidden(false)
        .build();
      const finding2 = FindingMother.basic()
        .withId('tool#1')
        .withHidden(false)
        .build();

      await repository.saveFinding({
        assessmentId: 'assessment1',
        organization: 'organization1',
        finding: finding1,
      });
      await repository.saveFinding({
        assessmentId: 'assessment1',
        organization: 'organization2',
        finding: finding2,
      });

      await repository.updateFinding({
        assessmentId: 'assessment1',
        organization: 'organization1',
        findingId: 'tool#1',
        findingBody: {
          hidden: true,
        },
      });

      const updatedFinding = await repository.getFinding({
        assessmentId: 'assessment1',
        findingId: 'tool#1',
        organization: 'organization1',
      });
      const otherFinding = await repository.getFinding({
        assessmentId: 'assessment1',
        findingId: 'tool#1',
        organization: 'organization2',
      });

      expect(updatedFinding).toEqual(expect.objectContaining({ hidden: true }));
      expect(otherFinding).toEqual(expect.objectContaining({ hidden: false }));
    });
  });

  describe('updateQuestion', () => {
    it('should update a question in an assessment', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization1')
        .withFindings([
          PillarMother.basic()
            .withId('pillar1')
            .withQuestions([
              QuestionMother.basic()
                .withId('question1')
                .withDisabled(false)
                .withNone(false)
                .build(),
            ])
            .build(),
        ])
        .build();
      await repository.save(assessment);

      await repository.updateQuestion({
        assessmentId: 'assessment1',
        organization: 'organization1',
        pillarId: 'pillar1',
        questionId: 'question1',
        questionBody: {
          disabled: true,
          none: true,
        },
      });

      const updatedAssessment = await repository.get({
        assessmentId: 'assessment1',
        organization: 'organization1',
      });

      expect(updatedAssessment?.findings?.[0]?.questions?.[0]).toEqual(
        expect.objectContaining({ id: 'question1', disabled: true, none: true })
      );
    });

    it('should throw a EmptyBodyError if questionBody is empty', async () => {
      const { repository } = setup();
      const assessment = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization1')
        .withFindings([
          PillarMother.basic()
            .withId('pillar1')
            .withQuestions([
              QuestionMother.basic()
                .withId('question1')
                .withDisabled(false)
                .withNone(false)
                .build(),
            ])
            .build(),
        ])
        .build();
      await repository.save(assessment);
      await expect(
        repository.updateQuestion({
          assessmentId: 'assessment1',
          organization: 'organization1',
          pillarId: 'pillar1',
          questionId: 'question1',
          questionBody: {},
        })
      ).rejects.toThrow(EmptyUpdateBodyError);
    });

    it('should throw a AssessmentNotFound if assessment does not exist', async () => {
      const { repository } = setup();

      await expect(
        repository.updateQuestion({
          assessmentId: 'assessment1',
          organization: 'organization1',
          pillarId: 'pillar1',
          questionId: 'question1',
          questionBody: {
            disabled: true,
            none: true,
          },
        })
      ).rejects.toThrow(AssessmentNotFoundError);
    });

    it('should throw a PillarNotFound if pillar does not exist', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization1')
        .withFindings([])
        .build();
      await repository.save(assessment);

      await expect(
        repository.updateQuestion({
          assessmentId: 'assessment1',
          organization: 'organization1',
          pillarId: 'pillar1',
          questionId: 'question1',
          questionBody: {
            disabled: true,
            none: true,
          },
        })
      ).rejects.toThrow(PillarNotFoundError);
    });

    it('should throw a QuestionNotFound if question does not exist', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization1')
        .withFindings([
          PillarMother.basic().withId('pillar1').withQuestions([]).build(),
        ])
        .build();
      await repository.save(assessment);

      await expect(
        repository.updateQuestion({
          assessmentId: 'assessment1',
          organization: 'organization1',
          pillarId: 'pillar1',
          questionId: 'question1',
          questionBody: {
            disabled: true,
            none: true,
          },
        })
      ).rejects.toThrow(QuestionNotFoundError);
    });

    it('should be scoped by organization', async () => {
      const { repository } = setup();

      const assessment1 = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization1')
        .withFindings([
          PillarMother.basic()
            .withId('pillar1')
            .withQuestions([
              QuestionMother.basic()
                .withId('question1')
                .withDisabled(false)
                .withNone(false)
                .build(),
            ])
            .build(),
        ])
        .build();
      await repository.save(assessment1);

      const assessment2 = AssessmentMother.basic()
        .withId('assessment2')
        .withOrganization('organization2')
        .withFindings([
          PillarMother.basic()
            .withId('pillar1')
            .withQuestions([
              QuestionMother.basic()
                .withId('question1')
                .withDisabled(false)
                .withNone(false)
                .build(),
            ])
            .build(),
        ])
        .build();
      await repository.save(assessment2);

      await repository.updateQuestion({
        assessmentId: 'assessment1',
        organization: 'organization1',
        pillarId: 'pillar1',
        questionId: 'question1',
        questionBody: {
          disabled: true,
          none: true,
        },
      });

      const updatedAssessment1 = await repository.get({
        assessmentId: 'assessment1',
        organization: 'organization1',
      });
      const updatedAssessment2 = await repository.get({
        assessmentId: 'assessment2',
        organization: 'organization2',
      });

      expect(updatedAssessment1?.findings?.[0]?.questions?.[0]).toEqual(
        expect.objectContaining({ id: 'question1', disabled: true, none: true })
      );
      expect(updatedAssessment2?.findings?.[0]?.questions?.[0]).toEqual(
        expect.objectContaining({
          id: 'question1',
          disabled: false,
          none: false,
        })
      );
    });
  });

  describe('updateRawGraphDataForScanningTool', () => {
    it('should update the raw graph data for a scanning tool', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization1')
        .withRawGraphData({})
        .build();
      await repository.save(assessment);

      const graphData = AssessmentGraphDataMother.basic()
        .withFindings(100)
        .withRegions({
          'us-west-2': 50,
          'us-east-1': 50,
        })
        .withResourceTypes({
          AwsAccount: 5,
          AwsEc2Instance: 10,
          AwsIamUser: 20,
          AwsS3Bucket: 30,
        })
        .withSeverities({
          [SeverityType.Critical]: 10,
          [SeverityType.High]: 20,
          [SeverityType.Medium]: 30,
          [SeverityType.Low]: 40,
        })
        .build();

      await repository.updateRawGraphDataForScanningTool({
        assessmentId: 'assessment1',
        organization: 'organization1',
        scanningTool: ScanningTool.PROWLER,
        graphData,
      });

      const updatedAssessment = await repository.get({
        assessmentId: 'assessment1',
        organization: 'organization1',
      });

      expect(updatedAssessment?.rawGraphData).toEqual({
        [ScanningTool.PROWLER]: graphData,
      });
    });

    it('should not overwrite existing raw graph data for other scanning tools', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization1')
        .withRawGraphData({
          [ScanningTool.CLOUD_CUSTODIAN]:
            AssessmentGraphDataMother.basic().build(),
        })
        .build();
      await repository.save(assessment);

      const graphData = AssessmentGraphDataMother.basic()
        .withFindings(100)
        .withRegions({
          'us-west-2': 50,
          'us-east-1': 50,
        })
        .withResourceTypes({
          AwsAccount: 5,
          AwsEc2Instance: 10,
          AwsIamUser: 20,
          AwsS3Bucket: 30,
        })
        .withSeverities({
          [SeverityType.Critical]: 10,
          [SeverityType.High]: 20,
          [SeverityType.Medium]: 30,
          [SeverityType.Low]: 40,
        })
        .build();

      await repository.updateRawGraphDataForScanningTool({
        assessmentId: 'assessment1',
        organization: 'organization1',
        scanningTool: ScanningTool.PROWLER,
        graphData,
      });

      const updatedAssessment = await repository.get({
        assessmentId: 'assessment1',
        organization: 'organization1',
      });

      expect(updatedAssessment?.rawGraphData).toEqual({
        [ScanningTool.PROWLER]: graphData,
        [ScanningTool.CLOUD_CUSTODIAN]: expect.any(Object),
      });
    });

    it('should throw an error if the assessment does not exist', async () => {
      const { repository } = setup();

      await expect(
        repository.updateRawGraphDataForScanningTool({
          assessmentId: 'assessment1',
          organization: 'organization1',
          scanningTool: ScanningTool.PROWLER,
          graphData: AssessmentGraphDataMother.basic().build(),
        })
      ).rejects.toThrow(AssessmentNotFoundError);
    });

    it('should be scoped by organization', async () => {
      const { repository } = setup();

      const assessment1 = AssessmentMother.basic()
        .withId('assessment1')
        .withOrganization('organization1')
        .withRawGraphData({
          [ScanningTool.PROWLER]: AssessmentGraphDataMother.basic().build(),
        })
        .build();
      await repository.save(assessment1);

      const assessment2 = AssessmentMother.basic()
        .withId('assessment2')
        .withOrganization('organization2')
        .withRawGraphData({
          [ScanningTool.PROWLER]: AssessmentGraphDataMother.basic().build(),
        })
        .build();
      await repository.save(assessment2);

      const graphData = AssessmentGraphDataMother.basic()
        .withFindings(100)
        .withRegions({
          'us-west-2': 50,
          'us-east-1': 50,
        })
        .withResourceTypes({
          AwsAccount: 5,
          AwsEc2Instance: 10,
          AwsIamUser: 20,
          AwsS3Bucket: 30,
        })
        .withSeverities({
          [SeverityType.Critical]: 10,
          [SeverityType.High]: 20,
          [SeverityType.Medium]: 30,
          [SeverityType.Low]: 40,
        })
        .build();

      await repository.updateRawGraphDataForScanningTool({
        assessmentId: 'assessment1',
        organization: 'organization1',
        scanningTool: ScanningTool.PROWLER,
        graphData,
      });

      const updatedAssessment1 = await repository.get({
        assessmentId: 'assessment1',
        organization: 'organization1',
      });
      const updatedAssessment2 = await repository.get({
        assessmentId: 'assessment2',
        organization: 'organization2',
      });

      expect(updatedAssessment1?.rawGraphData).toEqual({
        [ScanningTool.PROWLER]: graphData,
      });
      expect(updatedAssessment2?.rawGraphData).toEqual({
        [ScanningTool.PROWLER]: expect.any(Object),
      });
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  register(tokenDynamoDBAssessmentTableName, {
    useFactory: () => {
      assertIsDefined(
        process.env.ASSESSMENT_TABLE,
        'ASSESSMENT_TABLE is not defined'
      );
      return process.env.ASSESSMENT_TABLE;
    },
  });

  return { repository: new AssessmentsRepositoryDynamoDB() };
};
