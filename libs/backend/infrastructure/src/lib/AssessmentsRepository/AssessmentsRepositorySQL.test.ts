import {
  AssessmentFileExportMother,
  AssessmentFileExportStatus,
  AssessmentFileExportType,
  AssessmentMother,
  BestPracticeMother,
  PillarMother,
  QuestionMother,
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

vitest.useFakeTimers();

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
        .withFinishedAt(undefined)
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

  describe('saveFileExport', () => {
    it('should create the file export for an export type if it does not exist', async () => {
      const { repository } = setup();

      const fileExport = AssessmentFileExportMother.basic()
        .withType(AssessmentFileExportType.PDF)
        .build();

      const assessment = AssessmentMother.basic()
        .withOrganization('organization1')
        .build();
      await repository.save(assessment);

      await repository.saveFileExport({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        fileExport,
      });

      const updatedAssessment = await repository.get({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
      });

      expect(updatedAssessment?.fileExports).toStrictEqual([fileExport]);
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

      vitest.advanceTimersByTime(1);

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

      vitest.advanceTimersByTime(1);

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
      const { repository, date } = setup();

      const assessment = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .withName('Old Name')
        .withQuestionVersion('0.1')
        .withFinishedAt(undefined)
        .withExportRegion('us-east-1')
        .withOpportunityId('old-opportunity-id')
        .withWAFRWorkloadArn('arn:aws:wafr:us-east-1:123456789012:workload/old')
        .withExecutionArn('old-execution-arn')
        .build();
      await repository.save(assessment);

      await repository.update({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        assessmentBody: {
          name: 'New Name',
          questionVersion: '1.0',
          error: { cause: 'An error occurred', error: 'InternalError' },
          exportRegion: 'us-west-2',
          opportunityId: 'new-opportunity-id',
          finishedAt: date,
          wafrWorkloadArn:
            'arn:aws:wafr:us-west-2:123456789012:workload/abcd1234',
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
          questionVersion: '1.0',
          error: { cause: 'An error occurred', error: 'InternalError' },
          exportRegion: 'us-west-2',
          opportunityId: 'new-opportunity-id',
          finishedAt: date,
          wafrWorkloadArn:
            'arn:aws:wafr:us-west-2:123456789012:workload/abcd1234',
          executionArn: 'new-execution-arn',
        }),
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

  describe('updateFileExport', () => {
    it('should update the file export for an export type', async () => {
      const { repository } = setup();

      const assessmentFileExport = AssessmentFileExportMother.basic()
        .withStatus(AssessmentFileExportStatus.NOT_STARTED)
        .withType(AssessmentFileExportType.PDF)
        .build();
      const assessment = AssessmentMother.basic()
        .withOrganization('organization1')
        .withFileExports([assessmentFileExport])
        .build();
      await repository.save(assessment);

      const fileExport = AssessmentFileExportMother.basic()
        .withId(assessmentFileExport.id)
        .withStatus(AssessmentFileExportStatus.IN_PROGRESS)
        .withType(AssessmentFileExportType.PDF)
        .build();

      await repository.updateFileExport({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        data: fileExport,
      });

      const updatedAssessment = await repository.get({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
      });

      expect(updatedAssessment?.fileExports).toStrictEqual([fileExport]);
    });

    it('should throw when trying to update a non-existing file export', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withOrganization('organization1')
        .build();
      await repository.save(assessment);

      const missingFileExport = AssessmentFileExportMother.basic()
        .withId('non-existing-id')
        .build();

      await expect(
        repository.updateFileExport({
          assessmentId: assessment.id,
          organizationDomain: assessment.organization,
          data: missingFileExport,
        }),
      ).rejects.toThrow(/File Export not found/);
    });
  });

  describe('deleteFileExport', () => {
    it('should delete the file export for an export type', async () => {
      const { repository } = setup();

      const assessmentFileExport = AssessmentFileExportMother.basic()
        .withStatus(AssessmentFileExportStatus.NOT_STARTED)
        .withType(AssessmentFileExportType.PDF)
        .build();
      const assessment = AssessmentMother.basic()
        .withOrganization('organization1')
        .withFileExports([assessmentFileExport])
        .build();
      await repository.save(assessment);

      await repository.deleteFileExport({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        id: assessmentFileExport.id,
      });

      const updatedAssessment = await repository.get({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
      });

      expect(updatedAssessment?.fileExports).toStrictEqual([]);
    });
  });

  describe('GetOpportunitiesByYear', () => {
    it('should return an empty array if no assessments with non-undefined opportunityId and opportunityCreatedAt', async () => {
      const { repository, date } = setup();

      const assessment1 = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .withOpportunityId(undefined)
        .withOpportunityCreatedAt(undefined)
        .build();

      await repository.save(assessment1);

      const assessment2 = AssessmentMother.basic()
        .withId('2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .withOpportunityId('opp2')
        .withOpportunityCreatedAt(undefined)
        .build();

      await repository.save(assessment2);

      const result = await repository.getOpportunitiesByYear({
        organizationDomain: assessment1.organization,
        year: date.getFullYear(),
      });
      expect(result).toEqual([]);
    });

    it('should return only assessments with non-null opportunityId and opportunityCreatedAt', async () => {
      const { repository, date } = setup();
      const assessment1 = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .withOpportunityId(undefined)
        .withOpportunityCreatedAt(date)
        .build();

      await repository.save(assessment1);

      const assessment2 = AssessmentMother.basic()
        .withId('2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .withOpportunityId('opp2')
        .withOpportunityCreatedAt(undefined)
        .build();

      await repository.save(assessment2);

      const assessment3 = AssessmentMother.basic()
        .withId('3b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .withOpportunityId('opp3')
        .withOpportunityCreatedAt(date)
        .build();

      await repository.save(assessment3);

      const result = await repository.getOpportunitiesByYear({
        organizationDomain: assessment1.organization,
        year: date.getFullYear(),
      });
      expect(result).toHaveLength(1);
      expect(result).toEqual([{ id: 'opp3', createdAt: date }]);
    });

    it('should return results ordered by opportunityCreatedAt DESC', async () => {
      const { repository, date } = setup();

      const assessment1 = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .withOpportunityId('opp1')
        .withOpportunityCreatedAt(date)
        .build();

      await repository.save(assessment1);

      vitest.advanceTimersByTime(1);
      const date1 = new Date();

      const assessment2 = AssessmentMother.basic()
        .withId('2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .withOpportunityId('opp2')
        .withOpportunityCreatedAt(date1)
        .build();

      await repository.save(assessment2);

      const result = await repository.getOpportunitiesByYear({
        organizationDomain: assessment1.organization,
        year: date.getFullYear(),
      });
      expect(result).toHaveLength(2);
      expect(result[0].createdAt).toEqual(date1);
      expect(result[1].createdAt).toEqual(date);
    });
  });

  describe('countAssessmentsByYear', () => {
    it('should return 0 if no assessments exist for the given year', async () => {
      const { repository, date } = setup();

      const assessment = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .withCreatedAt(
          new Date(`${date.getFullYear() - 1}-06-15T00:00:00.000Z`),
        )
        .build();

      await repository.save(assessment);

      const result = await repository.countAssessmentsByYear({
        organizationDomain: 'organization1',
        year: date.getFullYear(),
      });

      expect(result).toBe(0);
    });

    it('should count all assessments created in the given year', async () => {
      const { repository, date } = setup();
      const year = date.getFullYear();

      const assessment1 = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .withCreatedAt(new Date(`${year}-01-15T00:00:00.000Z`))
        .build();

      await repository.save(assessment1);

      const assessment2 = AssessmentMother.basic()
        .withId('2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .withCreatedAt(new Date(`${year}-06-20T00:00:00.000Z`))
        .build();

      await repository.save(assessment2);

      const assessment3 = AssessmentMother.basic()
        .withId('3b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .withCreatedAt(new Date(`${year}-12-31T23:59:59.999Z`))
        .build();

      await repository.save(assessment3);

      const result = await repository.countAssessmentsByYear({
        organizationDomain: 'organization1',
        year,
      });

      expect(result).toBe(3);
    });

    it('should not count assessments from different years', async () => {
      const { repository, date } = setup();
      const year = date.getFullYear();

      const assessment1 = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .withCreatedAt(new Date(`${year}-01-01T00:00:00.000Z`))
        .build();

      await repository.save(assessment1);

      const assessment2 = AssessmentMother.basic()
        .withId('2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .withCreatedAt(new Date(`${year - 1}-12-31T23:59:59.999Z`))
        .build();

      await repository.save(assessment2);

      const assessment3 = AssessmentMother.basic()
        .withId('3b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .withCreatedAt(new Date(`${year + 1}-01-01T00:00:00.000Z`))
        .build();

      await repository.save(assessment3);

      const result = await repository.countAssessmentsByYear({
        organizationDomain: 'organization1',
        year,
      });

      expect(result).toBe(1);
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  const date = new Date();
  vitest.setSystemTime(date);

  return { repository: new AssessmentsRepositorySQL(), date };
};
