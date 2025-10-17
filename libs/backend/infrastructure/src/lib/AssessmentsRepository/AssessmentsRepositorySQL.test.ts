import {
  AssessmentFileExportMother,
  AssessmentFileExportStatus,
  AssessmentFileExportType,
  AssessmentGraphDataMother,
  AssessmentMother,
  BestPracticeMother,
  PillarMother,
  QuestionMother,
  ScanningTool,
  SeverityType,
} from '@backend/models';
import { inject, reset } from '@shared/di-container';
import { encodeNextToken } from '@shared/utils';

import { registerTestInfrastructure } from '../registerTestInfrastructure';
import { tokenTypeORMClientManager } from '../TypeORMClientManager';
import { AssessmentsRepositorySQL } from './AssessmentsRepositorySQL';

beforeAll(async () => {
  reset();
  registerTestInfrastructure();
  const clientManager = inject(tokenTypeORMClientManager);
  await clientManager.initialize();
  await clientManager.createClient('organization1');
  await clientManager.createClient('organization2');
});

afterEach(async () => {
  const clientManager = inject(tokenTypeORMClientManager);
  await clientManager.clearClients();
});

afterAll(async () => {
  const clientManager = inject(tokenTypeORMClientManager);
  await clientManager.closeConnections();
});

describe('AssessmentsRepositorySQL', () => {
  describe('save', () => {
    it('should save an assessment to SQL', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withCreatedAt(new Date('2023-01-01T00:00:00Z'))
        .withCreatedBy('user1')
        .withExecutionArn(
          'arn:aws:states:us-west-2:123456789012:execution:MyStateMachine:execution1',
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
        .withFinished(false)
        .withWorkflows(['workflow-1', 'workflow-2'])
        .build();

      await repository.save(assessment);

      const savedAssessment = await repository.get({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
      });
      expect(savedAssessment).toEqual(assessment);
    });
  });

  describe('saveBestPracticeFindings', () => {
    it('should add findings to a best practice', async () => {
      const { repository } = setup();

      const bestPractice = BestPracticeMother.basic().withId('0').build();
      const question = QuestionMother.basic()
        .withId('0')
        .withBestPractices([bestPractice])
        .build();
      const question2 = QuestionMother.basic()
        .withId('2')
        .withBestPractices([bestPractice])
        .build();
      const pillar = PillarMother.basic()
        .withId('0')
        .withQuestions([question])
        .build();
      const pillar2 = PillarMother.basic()
        .withId('2')
        .withQuestions([question2])
        .build();
      const assessment = AssessmentMother.basic()
        .withOrganization('organization1')
        .withPillars([pillar, pillar2])
        .build();
      await repository.save(assessment);
      await repository.saveBestPracticeFindings({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        pillarId: pillar2.id,
        questionId: question2.id,
        bestPracticeId: bestPractice.id,
        bestPracticeFindingIds: new Set(['scanningTool#1']),
      });

      const updatedAssessment = await repository.get({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
      });
      expect(
        updatedAssessment?.pillars?.[0].questions?.[0].bestPractices?.[0].results.has(
          'scanningTool#1',
        ),
      ).toBe(false);
      expect(
        updatedAssessment?.pillars?.[1].questions?.[0].bestPractices?.[0].results.has(
          'scanningTool#1',
        ),
      ).toBe(true);
    });

    it('should add several findings to a best practice', async () => {
      const { repository } = setup();

      const bestPractice = BestPracticeMother.basic().withId('0').build();
      const question = QuestionMother.basic()
        .withId('0')
        .withBestPractices([bestPractice])
        .build();
      const pillar = PillarMother.basic()
        .withId('0')
        .withQuestions([question])
        .build();
      const assessment = AssessmentMother.basic()
        .withOrganization('organization1')
        .withPillars([pillar])
        .build();
      await repository.save(assessment);

      await repository.saveBestPracticeFindings({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        pillarId: pillar.id,
        questionId: question.id,
        bestPracticeId: bestPractice.id,
        bestPracticeFindingIds: new Set(['scanningTool#1', 'scanningTool#2']),
      });

      const updatedAssessment = await repository.get({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
      });
      expect(
        updatedAssessment?.pillars?.[0].questions?.[0].bestPractices?.[0].results.has(
          'scanningTool#1',
        ),
      ).toBe(true);
      expect(
        updatedAssessment?.pillars?.[0].questions?.[0].bestPractices?.[0].results.has(
          'scanningTool#2',
        ),
      ).toBe(true);
    });

    it('should be able to add findings several times', async () => {
      const { repository } = setup();

      const bestPractice = BestPracticeMother.basic().withId('0').build();
      const question = QuestionMother.basic()
        .withId('0')
        .withBestPractices([bestPractice])
        .build();
      const pillar = PillarMother.basic()
        .withId('0')
        .withQuestions([question])
        .build();
      const assessment = AssessmentMother.basic()
        .withOrganization('organization1')
        .withPillars([pillar])
        .build();
      await repository.save(assessment);

      await repository.saveBestPracticeFindings({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        pillarId: pillar.id,
        questionId: question.id,
        bestPracticeId: bestPractice.id,
        bestPracticeFindingIds: new Set(['scanningTool#1']),
      });

      await repository.saveBestPracticeFindings({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        pillarId: pillar.id,
        questionId: question.id,
        bestPracticeId: bestPractice.id,
        bestPracticeFindingIds: new Set(['scanningTool#2']),
      });

      const updatedAssessment = await repository.get({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
      });
      expect(
        updatedAssessment?.pillars?.[0].questions?.[0].bestPractices?.[0].results.has(
          'scanningTool#1',
        ),
      ).toBe(true);
      expect(
        updatedAssessment?.pillars?.[0].questions?.[0].bestPractices?.[0].results.has(
          'scanningTool#2',
        ),
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
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
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
        .withOrganization('organization1')
        .build();

      await repository.save(assessment);

      const fetchedAssessments = await repository.getAll({
        organizationDomain: assessment.organization,
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
        organizationDomain: assessment1.organization,
        search: assessment1.id,
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
        organizationDomain: assessment1.organization,
        limit: 1,
      });

      expect(fetchedAssessments).toEqual({
        assessments: [
          expect.objectContaining({
            id: assessment2.id,
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
        offset: 1,
      };
      const nextToken = encodeNextToken(nextTokenAssessment);

      const fetchedAssessments = await repository.getAll({
        organizationDomain: assessment1.organization,
        nextToken,
      });

      expect(fetchedAssessments).toEqual({
        assessments: [assessment1],
        nextToken: undefined,
      });
    });

    it('should return an empty list if assessments does not match the organization', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
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
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
      });

      const fetchedAssessment = await repository.get({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
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
        assessmentId: assessment1.id,
        organizationDomain: assessment1.organization,
      });

      const fetchedAssessment1 = await repository.get({
        assessmentId: assessment1.id,
        organizationDomain: assessment1.organization,
      });

      const fetchedAssessment2 = await repository.get({
        assessmentId: assessment2.id,
        organizationDomain: assessment2.organization,
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
        .withPillars([
          PillarMother.basic()
            .withId('old-pillar-1')
            .withQuestions([
              QuestionMother.basic()
                .withId('old-question-1')
                .withBestPractices([
                  BestPracticeMother.basic()
                    .withId('old-best-practice-1')
                    .withResults(new Set(['prowler#old']))
                    .build(),
                ])
                .build(),
            ])
            .build(),
        ])
        .withQuestionVersion('0.1')
        .withRawGraphData({
          [ScanningTool.PROWLER]: AssessmentGraphDataMother.basic()
            .withFindings(0)
            .withRegions({})
            .withResourceTypes({})
            .withSeverities({})
            .build(),
        })
        .withFileExports({
          [AssessmentFileExportType.PDF]: [
            AssessmentFileExportMother.basic().withId('old-pdf-export').build(),
          ],
        })
        .withFinished(false)
        .withExportRegion('us-east-1')
        .withOpportunityId('old-opportunity-id')
        .withWAFRWorkloadArn('arn:aws:wafr:us-east-1:123456789012:workload/old')
        .withGraphData(
          AssessmentGraphDataMother.basic()
            .withFindings(0)
            .withRegions({})
            .withResourceTypes({})
            .withSeverities({})
            .build(),
        )
        .withExecutionArn('old-execution-arn')
        .build();
      await repository.save(assessment);

      const updatedProwlerGraphData = AssessmentGraphDataMother.basic()
        .withFindings(1)
        .withRegions({ 'us-west-2': 1 })
        .withResourceTypes({ 'aws-ec2': 1 })
        .withSeverities({ [SeverityType.High]: 1 })
        .build();
      await repository.update({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
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
          error: { cause: 'An error occurred', error: 'InternalError' },
          exportRegion: 'us-west-2',
          opportunityId: 'new-opportunity-id',
          finished: true,
          wafrWorkloadArn:
            'arn:aws:wafr:us-west-2:123456789012:workload/abcd1234',
          fileExports: {
            [AssessmentFileExportType.PDF]: [
              AssessmentFileExportMother.basic().withId('pdf-export').build(),
            ],
          },
          graphData: updatedProwlerGraphData,
          executionArn: 'new-execution-arn',
        },
      });

      const updatedAssessment = await repository.get({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
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
          error: { cause: 'An error occurred', error: 'InternalError' },
          exportRegion: 'us-west-2',
          opportunityId: 'new-opportunity-id',
          finished: true,
          wafrWorkloadArn:
            'arn:aws:wafr:us-west-2:123456789012:workload/abcd1234',
          fileExports: {
            [AssessmentFileExportType.PDF]: [
              expect.objectContaining({ id: 'pdf-export' }),
            ],
          },
          graphData: updatedProwlerGraphData,
          executionArn: 'new-execution-arn',
        }),
      );
      expect(updatedAssessment?.pillars).toHaveLength(1);
      expect(updatedAssessment?.pillars).not.toContainEqual(
        expect.objectContaining({ id: 'old-pillar-1' }),
      );
      expect(updatedAssessment?.pillars?.[0]?.questions).not.toContainEqual(
        expect.objectContaining({ id: 'old-question-1' }),
      );
      expect(
        updatedAssessment?.pillars?.[0]?.questions[0]?.bestPractices,
      ).not.toContainEqual(
        expect.objectContaining({ id: 'old-best-practice-1' }),
      );

      expect(
        updatedAssessment?.fileExports?.[AssessmentFileExportType.PDF],
      ).toHaveLength(1);
      expect(
        updatedAssessment?.fileExports?.[AssessmentFileExportType.PDF],
      ).not.toContainEqual(expect.objectContaining({ id: 'old-pdf-export' }));

      expect(updatedAssessment?.pillars?.[0]?.id).toBe('pillar-1');
      expect(updatedAssessment?.pillars?.[0]?.questions[0]?.id).toBe(
        'question-1',
      );
      expect(
        updatedAssessment?.pillars?.[0]?.questions[0]?.bestPractices[0]?.id,
      ).toBe('best-practice-1');
      expect(
        updatedAssessment?.fileExports?.[AssessmentFileExportType.PDF]?.[0]?.id,
      ).toBe('pdf-export');
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
        assessmentId: assessment1.id,
        organizationDomain: assessment1.organization,
        assessmentBody: { name: 'New Name' },
      });

      const updatedAssessment1 = await repository.get({
        assessmentId: assessment1.id,
        organizationDomain: assessment1.organization,
      });
      const updatedAssessment2 = await repository.get({
        assessmentId: assessment2.id,
        organizationDomain: assessment2.organization,
      });

      expect(updatedAssessment1).toEqual(
        expect.objectContaining({ name: 'New Name' }),
      );
      expect(updatedAssessment2).toEqual(
        expect.objectContaining({ name: 'Old Name' }),
      );
    });
  });

  describe('updatePillar', () => {
    it('should update the pillar disabled status', async () => {
      const { repository } = setup();

      const pillar = PillarMother.basic().withDisabled(false).build();
      const assessment = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .withPillars([pillar])
        .build();
      await repository.save(assessment);

      await expect(
        repository.updatePillar({
          assessmentId: assessment.id,
          organizationDomain: assessment.organization,
          pillarId: pillar.id,
          pillarBody: {
            disabled: true,
          },
        }),
      ).resolves.not.toThrow();
      const updatedAssessment = await repository.get({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
      });
      expect(updatedAssessment?.pillars?.[0].disabled).toBe(true);
    });
  });

  describe('updateQuestion', () => {
    it('should update a question in an assessment', async () => {
      const { repository } = setup();

      const question = QuestionMother.basic()
        .withDisabled(false)
        .withNone(false)
        .build();
      const pillar = PillarMother.basic().withQuestions([question]).build();
      const assessment = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .withPillars([pillar])
        .build();
      await repository.save(assessment);

      await repository.updateQuestion({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        pillarId: pillar.id,
        questionId: question.id,
        questionBody: {
          disabled: true,
          none: true,
        },
      });

      const updatedAssessment = await repository.get({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
      });

      expect(updatedAssessment?.pillars?.[0]?.questions?.[0]).toEqual(
        expect.objectContaining({
          id: question.id,
          disabled: true,
          none: true,
        }),
      );
    });

    it('should be scoped by organization', async () => {
      const { repository } = setup();

      const question1 = QuestionMother.basic()
        .withDisabled(false)
        .withNone(false)
        .build();
      const pillar1 = PillarMother.basic().withQuestions([question1]).build();
      const assessment1 = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .withPillars([pillar1])
        .build();
      await repository.save(assessment1);

      const question2 = QuestionMother.basic()
        .withDisabled(false)
        .withNone(false)
        .build();
      const pillar2 = PillarMother.basic().withQuestions([question2]).build();
      const assessment2 = AssessmentMother.basic()
        .withId('2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization2')
        .withPillars([pillar2])
        .build();
      await repository.save(assessment2);

      await repository.updateQuestion({
        assessmentId: assessment1.id,
        organizationDomain: assessment1.organization,
        pillarId: pillar1.id,
        questionId: question1.id,
        questionBody: {
          disabled: true,
          none: true,
        },
      });

      const updatedAssessment1 = await repository.get({
        assessmentId: assessment1.id,
        organizationDomain: assessment1.organization,
      });
      const updatedAssessment2 = await repository.get({
        assessmentId: assessment2.id,
        organizationDomain: assessment2.organization,
      });

      expect(updatedAssessment1?.pillars?.[0]?.questions?.[0]).toEqual(
        expect.objectContaining({
          id: question1.id,
          disabled: true,
          none: true,
        }),
      );
      expect(updatedAssessment2?.pillars?.[0]?.questions?.[0]).toEqual(
        expect.objectContaining({
          id: question2.id,
          disabled: false,
          none: false,
        }),
      );
    });
  });

  describe('updateBestPractice', () => {
    it('should update the best practice status', async () => {
      const { repository } = setup();

      const bestPractice = BestPracticeMother.basic()
        .withChecked(false)
        .build();
      const question = QuestionMother.basic()
        .withBestPractices([bestPractice])
        .build();
      const pillar = PillarMother.basic().withQuestions([question]).build();
      const assessment = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .withPillars([pillar])
        .build();
      await repository.save(assessment);

      await expect(
        repository.updateBestPractice({
          assessmentId: assessment.id,
          organizationDomain: assessment.organization,
          pillarId: pillar.id,
          questionId: question.id,
          bestPracticeId: bestPractice.id,
          bestPracticeBody: {
            checked: true,
          },
        }),
      ).resolves.not.toThrow();
      const updatedAssessment = await repository.get({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
      });
      expect(
        updatedAssessment?.pillars?.[0].questions?.[0].bestPractices?.[0]
          .checked,
      ).toBe(true);
    });
  });

  describe('updateRawGraphDataForScanningTool', () => {
    it('should update the raw graph data for a scanning tool', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
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
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        scanningTool: ScanningTool.PROWLER,
        graphData,
      });

      const updatedAssessment = await repository.get({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
      });

      expect(updatedAssessment?.rawGraphData).toEqual({
        [ScanningTool.PROWLER]: graphData,
      });
    });

    it('should update the raw graph data for a scanning tool containing dashes in its name', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
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
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        scanningTool: ScanningTool.CLOUD_CUSTODIAN,
        graphData,
      });

      const updatedAssessment = await repository.get({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
      });

      expect(updatedAssessment?.rawGraphData).toEqual({
        [ScanningTool.CLOUD_CUSTODIAN]: graphData,
      });
    });

    it('should not overwrite existing raw graph data for other scanning tools', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
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
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        scanningTool: ScanningTool.PROWLER,
        graphData,
      });

      const updatedAssessment = await repository.get({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
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
        assessmentId: assessment1.id,
        organizationDomain: assessment1.organization,
        scanningTool: ScanningTool.PROWLER,
        graphData,
      });

      const updatedAssessment1 = await repository.get({
        assessmentId: assessment1.id,
        organizationDomain: assessment1.organization,
      });
      const updatedAssessment2 = await repository.get({
        assessmentId: assessment2.id,
        organizationDomain: assessment2.organization,
      });

      expect(updatedAssessment1?.rawGraphData).toEqual({
        [ScanningTool.PROWLER]: graphData,
      });
      expect(updatedAssessment2?.rawGraphData).toEqual({
        [ScanningTool.PROWLER]: expect.any(Object),
      });
    });
  });

  describe('updateFileExport', () => {
    it('should update the file export for an export type', async () => {
      const { repository } = setup();

      const assessmentFileExport = AssessmentFileExportMother.basic()
        .withStatus(AssessmentFileExportStatus.NOT_STARTED)
        .build();
      const assessment = AssessmentMother.basic()
        .withOrganization('organization1')
        .withFileExports({
          [AssessmentFileExportType.PDF]: [assessmentFileExport],
        })
        .build();
      await repository.save(assessment);

      const fileExport = AssessmentFileExportMother.basic()
        .withId(assessmentFileExport.id)
        .withStatus(AssessmentFileExportStatus.IN_PROGRESS)
        .build();

      await repository.updateFileExport({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        type: AssessmentFileExportType.PDF,
        data: fileExport,
      });

      const updatedAssessment = await repository.get({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
      });

      expect(updatedAssessment?.fileExports).toStrictEqual({
        [AssessmentFileExportType.PDF]: [fileExport],
      });
    });

    it('should create the file export for an export type if it does not exist', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withOrganization('organization1')
        .withFileExports({
          [AssessmentFileExportType.PDF]: [],
        })
        .build();
      await repository.save(assessment);

      const fileExport = AssessmentFileExportMother.basic().build();

      await repository.updateFileExport({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        type: AssessmentFileExportType.PDF,
        data: fileExport,
      });

      const updatedAssessment = await repository.get({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
      });

      expect(updatedAssessment?.fileExports).toStrictEqual({
        [AssessmentFileExportType.PDF]: [fileExport],
      });
    });
  });

  describe('deleteFileExport', () => {
    it('should delete the file export for an export type', async () => {
      const { repository } = setup();

      const assessmentFileExport = AssessmentFileExportMother.basic()
        .withStatus(AssessmentFileExportStatus.NOT_STARTED)
        .build();
      const assessment = AssessmentMother.basic()
        .withOrganization('organization1')
        .withFileExports({
          [AssessmentFileExportType.PDF]: [assessmentFileExport],
        })
        .build();
      await repository.save(assessment);

      await repository.deleteFileExport({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        type: AssessmentFileExportType.PDF,
        id: assessmentFileExport.id,
      });

      const updatedAssessment = await repository.get({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
      });

      expect(updatedAssessment?.fileExports).toStrictEqual({});
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  return { repository: new AssessmentsRepositorySQL() };
};
