import { DeleteItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';

import {
  AssessmentGraphDataMother,
  AssessmentMother,
  AssessmentStep,
  BestPracticeMother,
  PillarMother,
  QuestionMother,
  ScanningTool,
  SeverityType,
} from '@backend/models';
import { inject, reset } from '@shared/di-container';
import { encodeNextToken } from '@shared/utils';

import {
  tokenDynamoDBAssessmentTableName,
  tokenDynamoDBClient,
} from '../config/dynamodb/config';
import { registerTestInfrastructure } from '../registerTestInfrastructure';
import { AssessmentsRepositoryDynamoDB } from './AssessmentsRepositoryDynamoDB';

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
        .withPillars([
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
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .withName('Test Assessment')
        .withRegions(['us-west-1', 'us-west-2'])
        .withRoleArn('arn:aws:iam::123456789012:role/AssessmentRole')
        .withStep(AssessmentStep.FINISHED)
        .withWorkflows(['workflow-1', 'workflow-2'])
        .build();

      await repository.save(assessment);

      const savedAssessment = await repository.get({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
      });

      expect(savedAssessment).toEqual(assessment);
    });
  });

  describe('saveBestPracticeFindings', () => {
    it('should add findings to a best practice', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .withPillars([
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

      await repository.saveBestPracticeFindings({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        pillarId: '0',
        questionId: '0',
        bestPracticeId: '0',
        bestPracticeFindingIds: new Set(['scanningTool#1']),
      });

      const updatedAssessment = await repository.get({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
      });
      expect(
        updatedAssessment?.pillars?.[0].questions?.[0].bestPractices?.[0].results.has(
          'scanningTool#1'
        )
      ).toBe(true);
    });

    it('should add several findings to a best practice', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .withPillars([
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

      await repository.saveBestPracticeFindings({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        pillarId: '0',
        questionId: '0',
        bestPracticeId: '0',
        bestPracticeFindingIds: new Set(['scanningTool#1', 'scanningTool#2']),
      });

      const updatedAssessment = await repository.get({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
      });
      expect(
        updatedAssessment?.pillars?.[0].questions?.[0].bestPractices?.[0].results.has(
          'scanningTool#1'
        )
      ).toBe(true);
      expect(
        updatedAssessment?.pillars?.[0].questions?.[0].bestPractices?.[0].results.has(
          'scanningTool#2'
        )
      ).toBe(true);
    });

    it('should be able to add findings several times', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .withPillars([
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

      await repository.saveBestPracticeFindings({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        pillarId: '0',
        questionId: '0',
        bestPracticeId: '0',
        bestPracticeFindingIds: new Set(['scanningTool#1']),
      });

      await repository.saveBestPracticeFindings({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        pillarId: '0',
        questionId: '0',
        bestPracticeId: '0',
        bestPracticeFindingIds: new Set(['scanningTool#2']),
      });

      const updatedAssessment = await repository.get({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
      });
      expect(
        updatedAssessment?.pillars?.[0].questions?.[0].bestPractices?.[0].results.has(
          'scanningTool#1'
        )
      ).toBe(true);
      expect(
        updatedAssessment?.pillars?.[0].questions?.[0].bestPractices?.[0].results.has(
          'scanningTool#2'
        )
      ).toBe(true);
    });
  });

  describe('get', () => {
    it('should get an assessment by ID and organization', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .build();

      await repository.save(assessment);

      const fetchedAssessment = await repository.get({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
      });

      expect(fetchedAssessment).toEqual(assessment);
    });

    it('should return undefined if assessment does not exist', async () => {
      const { repository } = setup();

      const fetchedAssessment = await repository.get({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
      });

      expect(fetchedAssessment).toBeUndefined();
    });

    it('should be scoped by organization', async () => {
      const { repository } = setup();

      const assessment1 = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .build();
      await repository.save(assessment1);

      const assessment2 = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization2')
        .build();
      await repository.save(assessment2);

      const assessment3 = AssessmentMother.basic()
        .withId('2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization2')
        .build();
      await repository.save(assessment3);

      const fetchedAssessment1 = await repository.get({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
      });
      const fetchedAssessment2 = await repository.get({
        assessmentId: '2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
      });

      expect(fetchedAssessment1).toEqual(assessment1);
      expect(fetchedAssessment2).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('should return a list of assessment if it exists', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .build();

      await repository.save(assessment);

      const fetchedAssessments = await repository.getAll({
        organizationDomain: 'organization1',
      });

      expect(fetchedAssessments).toEqual({
        assessments: [assessment],
        nextToken: undefined,
      });
    });

    it('should return all assessments with matched search criteria', async () => {
      const { repository } = setup();

      const assessment1 = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .build();

      await repository.save(assessment1);

      const assessment2 = AssessmentMother.basic()
        .withId('2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .build();

      await repository.save(assessment2);

      const fetchedAssessments = await repository.getAll({
        organizationDomain: 'organization1',
        search: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      });

      expect(fetchedAssessments).toEqual({
        assessments: [assessment1],
        nextToken: undefined,
      });
    });

    it('should return all assessments within the limit', async () => {
      const { repository } = setup();

      const assessment1 = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .build();

      await repository.save(assessment1);

      const assessment2 = AssessmentMother.basic()
        .withId('2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .build();

      await repository.save(assessment2);

      const fetchedAssessments = await repository.getAll({
        organizationDomain: 'organization1',
        limit: 1,
      });

      expect(fetchedAssessments).toEqual({
        assessments: [
          expect.objectContaining({
            id: '2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
          }),
        ],
        nextToken: expect.any(String),
      });
    });

    it('should return all assessments after the next token', async () => {
      const { repository } = setup();

      const assessment1 = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .build();

      await repository.save(assessment1);

      const assessment2 = AssessmentMother.basic()
        .withId('2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .build();

      await repository.save(assessment2);

      const nextTokenAssessment = {
        PK: 'organization1',
        SK: 'ASSESSMENT#2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
      };
      const nextToken = encodeNextToken(nextTokenAssessment);

      const fetchedAssessments = await repository.getAll({
        organizationDomain: 'organization1',
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
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .build();

      await repository.save(assessment);

      const fetchedAssessments = await repository.getAll({
        organizationDomain: 'organization2',
      });

      expect(fetchedAssessments).toEqual({
        assessments: [],
        nextToken: undefined,
      });
    });

    it('should return an empty list if no assessments', async () => {
      const { repository } = setup();

      const fetchedAssessments = await repository.getAll({
        organizationDomain: 'organization1',
      });

      expect(fetchedAssessments).toEqual({
        assessments: [],
        nextToken: undefined,
      });
    });
  });

  describe('delete', () => {
    it('should delete an assessment by ID and organization', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .build();
      await repository.save(assessment);

      await repository.delete({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
      });

      const fetchedAssessment = await repository.get({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
      });

      expect(fetchedAssessment).toBeUndefined();
    });

    it('should be scoped by organization', async () => {
      const { repository } = setup();

      const assessment1 = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .build();
      await repository.save(assessment1);

      const assessment2 = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization2')
        .build();

      await repository.save(assessment2);

      await repository.delete({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
      });

      const fetchedAssessment1 = await repository.get({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
      });

      const fetchedAssessment2 = await repository.get({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization2',
      });

      expect(fetchedAssessment1).toBeUndefined();
      expect(fetchedAssessment2).toEqual(assessment2);
    });
  });

  describe('update', () => {
    it('should update the assessment', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .withName('Old Name')
        .withPillars([])
        .withQuestionVersion('0.1')
        .withRawGraphData({
          [ScanningTool.PROWLER]: AssessmentGraphDataMother.basic()
            .withFindings(0)
            .withRegions({})
            .withResourceTypes({})
            .withSeverities({})
            .build(),
        })
        .build();
      await repository.save(assessment);

      const updatedProwlerGraphData = AssessmentGraphDataMother.basic()
        .withFindings(1)
        .withRegions({ 'us-west-2': 1 })
        .withResourceTypes({ 'aws-ec2': 1 })
        .withSeverities({ [SeverityType.High]: 1 })
        .build();
      await repository.update({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        assessmentBody: {
          name: 'New Name',
          pillars: [
            PillarMother.basic()
              .withId('pillar-1')
              .withQuestions([
                QuestionMother.basic()
                  .withId('question-1')
                  .withBestPractices([
                    BestPracticeMother.basic()
                      .withId('best-practice-1')
                      .withResults(new Set(['prowler#1']))
                      .build(),
                  ])
                  .build(),
              ])
              .build(),
          ],
          questionVersion: '1.0',
          rawGraphData: {
            [ScanningTool.PROWLER]: updatedProwlerGraphData,
          },
        },
      });

      const updatedAssessment = await repository.get({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
      });

      expect(updatedAssessment).toEqual(
        expect.objectContaining({
          name: 'New Name',
          pillars: [
            expect.objectContaining({
              id: 'pillar-1',
              questions: [
                expect.objectContaining({
                  id: 'question-1',
                  bestPractices: [
                    expect.objectContaining({
                      id: 'best-practice-1',
                      results: new Set(['prowler#1']),
                    }),
                  ],
                }),
              ],
            }),
          ],
          questionVersion: '1.0',
          rawGraphData: {
            [ScanningTool.PROWLER]: updatedProwlerGraphData,
          },
        })
      );
    });

    it('should be scoped by organization', async () => {
      const { repository } = setup();

      const assessment1 = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .withName('Old Name')
        .build();
      await repository.save(assessment1);

      const assessment2 = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization2')
        .withName('Old Name')
        .build();
      await repository.save(assessment2);

      await repository.update({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        assessmentBody: { name: 'New Name' },
      });

      const updatedAssessment1 = await repository.get({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
      });
      const updatedAssessment2 = await repository.get({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization2',
      });

      expect(updatedAssessment1).toEqual(
        expect.objectContaining({ name: 'New Name' })
      );
      expect(updatedAssessment2).toEqual(
        expect.objectContaining({ name: 'Old Name' })
      );
    });
  });

  describe('updatePillar', () => {
    it('should update the pillar disabled status', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .withPillars([
          PillarMother.basic().withId('0').withDisabled(false).build(),
        ])
        .build();
      await repository.save(assessment);

      await expect(
        repository.updatePillar({
          assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
          organizationDomain: 'organization1',
          pillarId: '0',
          pillarBody: {
            disabled: true,
          },
        })
      ).resolves.not.toThrow();
      const updatedAssessment = await repository.get({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
      });
      expect(updatedAssessment?.pillars?.[0].disabled).toBe(true);
    });
  });

  describe('updateQuestion', () => {
    it('should update a question in an assessment', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .withPillars([
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
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        pillarId: 'pillar1',
        questionId: 'question1',
        questionBody: {
          disabled: true,
          none: true,
        },
      });

      const updatedAssessment = await repository.get({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
      });

      expect(updatedAssessment?.pillars?.[0]?.questions?.[0]).toEqual(
        expect.objectContaining({ id: 'question1', disabled: true, none: true })
      );
    });

    it('should be scoped by organization', async () => {
      const { repository } = setup();

      const assessment1 = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .withPillars([
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
        .withId('2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization2')
        .withPillars([
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
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        pillarId: 'pillar1',
        questionId: 'question1',
        questionBody: {
          disabled: true,
          none: true,
        },
      });

      const updatedAssessment1 = await repository.get({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
      });
      const updatedAssessment2 = await repository.get({
        assessmentId: '2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization2',
      });

      expect(updatedAssessment1?.pillars?.[0]?.questions?.[0]).toEqual(
        expect.objectContaining({ id: 'question1', disabled: true, none: true })
      );
      expect(updatedAssessment2?.pillars?.[0]?.questions?.[0]).toEqual(
        expect.objectContaining({
          id: 'question1',
          disabled: false,
          none: false,
        })
      );
    });
  });

  describe('updateBestPractice', () => {
    it('should update the best practice status', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .withPillars([
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
          assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
          organizationDomain: 'organization1',
          pillarId: '0',
          questionId: '0',
          bestPracticeId: '0',
          bestPracticeBody: {
            checked: true,
          },
        })
      ).resolves.not.toThrow();
      const updatedAssessment = await repository.get({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
      });
      expect(
        updatedAssessment?.pillars?.[0].questions?.[0].bestPractices?.[0]
          .checked
      ).toBe(true);
    });
  });

  describe('updateRawGraphDataForScanningTool', () => {
    it('should update the raw graph data for a scanning tool', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
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
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        scanningTool: ScanningTool.PROWLER,
        graphData,
      });

      const updatedAssessment = await repository.get({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
      });

      expect(updatedAssessment?.rawGraphData).toEqual({
        [ScanningTool.PROWLER]: graphData,
      });
    });

    it('should update the raw graph data for a scanning tool containing dashes in its name', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
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
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        scanningTool: ScanningTool.CLOUD_CUSTODIAN,
        graphData,
      });

      const updatedAssessment = await repository.get({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
      });

      expect(updatedAssessment?.rawGraphData).toEqual({
        [ScanningTool.CLOUD_CUSTODIAN]: graphData,
      });
    });

    it('should not overwrite existing raw graph data for other scanning tools', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
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
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        scanningTool: ScanningTool.PROWLER,
        graphData,
      });

      const updatedAssessment = await repository.get({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
      });

      expect(updatedAssessment?.rawGraphData).toEqual({
        [ScanningTool.PROWLER]: graphData,
        [ScanningTool.CLOUD_CUSTODIAN]: expect.any(Object),
      });
    });

    it('should be scoped by organization', async () => {
      const { repository } = setup();

      const assessment1 = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .withRawGraphData({
          [ScanningTool.PROWLER]: AssessmentGraphDataMother.basic().build(),
        })
        .build();
      await repository.save(assessment1);

      const assessment2 = AssessmentMother.basic()
        .withId('2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
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
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
        scanningTool: ScanningTool.PROWLER,
        graphData,
      });

      const updatedAssessment1 = await repository.get({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization1',
      });
      const updatedAssessment2 = await repository.get({
        assessmentId: '2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        organizationDomain: 'organization2',
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
  return { repository: new AssessmentsRepositoryDynamoDB() };
};
