import {
  AssessmentFileExportMother,
  AssessmentFileExportStatus,
  AssessmentFileExportType,
  AssessmentMother,
  AssessmentVersionMother,
  BestPracticeMother,
  PillarMother,
  QuestionMother,
} from '@backend/models';
import { inject, reset } from '@shared/di-container';
import { encodeNextToken } from '@shared/utils';

import { registerTestInfrastructure } from '../registerTestInfrastructure';
import { startPostgresContainer } from '../testUtils';
import { tokenTypeORMClientManager } from '../TypeORMClientManager';
import { AssessmentsRepositorySQL } from './AssessmentsRepositorySQL';

let pgContainer: Awaited<ReturnType<typeof startPostgresContainer>>;

beforeAll(async () => {
  reset();
  registerTestInfrastructure();
  pgContainer = await startPostgresContainer();

  const clientManager = inject(tokenTypeORMClientManager);
  await clientManager.initialize();
  await clientManager.createClient('organization1');
  await clientManager.createClient('organization2');
}, 30000);

afterEach(async () => {
  const clientManager = inject(tokenTypeORMClientManager);
  await clientManager.clearClients();
});

afterAll(async () => {
  const clientManager = inject(tokenTypeORMClientManager);
  await clientManager.closeConnections();
  await pgContainer.stop();
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
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .withName('Test Assessment')
        .withRegions(['us-west-1', 'us-west-2'])
        .withRoleArn('arn:aws:iam::123456789012:role/AssessmentRole')
        .withWorkflows(['workflow-1', 'workflow-2'])
        .withQuestionVersion('0.3')
        .build();

      const assessmentVersion = AssessmentVersionMother.basic()
        .withAssessmentId(assessment.id)
        .withVersion(assessment.latestVersionNumber)
        .withCreatedAt(new Date('2023-01-01T00:00:00Z'))
        .withCreatedBy('user1')
        .withExecutionArn(
          'arn:aws:states:us-west-2:123456789012:execution:MyStateMachine:execution1',
        )
        .withFinishedAt(undefined)
        .build();
      await repository.save(assessment);
      await repository.createVersion({
        assessmentVersion,
        organizationDomain: assessment.organization,
      });

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
      const assessmentVersion = AssessmentVersionMother.basic()
        .withAssessmentId(assessment.id)
        .withVersion(assessment.latestVersionNumber)
        .build();
      await repository.save(assessment);
      await repository.createVersion({
        assessmentVersion,
        organizationDomain: assessment.organization,
      });

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

      const assessmentVersion = AssessmentVersionMother.basic()
        .withAssessmentId(assessment.id)
        .withVersion(assessment.latestVersionNumber)
        .build();
      await repository.save(assessment);
      await repository.createVersion({
        assessmentVersion,
        organizationDomain: assessment.organization,
      });

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
      const assessmentVersion1 = AssessmentVersionMother.basic()
        .withAssessmentId(assessment1.id)
        .withVersion(assessment1.latestVersionNumber)
        .build();
      await repository.save(assessment1);
      await repository.createVersion({
        assessmentVersion: assessmentVersion1,
        organizationDomain: assessment1.organization,
      });

      const assessment2 = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization2')
        .build();
      const assessmentVersion2 = AssessmentVersionMother.basic()
        .withAssessmentId(assessment2.id)
        .withVersion(assessment2.latestVersionNumber)
        .build();
      await repository.save(assessment2);
      await repository.createVersion({
        assessmentVersion: assessmentVersion2,
        organizationDomain: assessment2.organization,
      });

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

    it('should return assessment with its latest version', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withOrganization('organization1')
        .withName('Test Assessment')
        .withRegions(['us-east-1'])
        .withWorkflows(['workflow-1'])
        .withFileExports([])
        .withPillars([])
        .withLatestVersionNumber(1)
        .withCreatedBy('old-user')
        .withCreatedAt(new Date('2026-01-01'))
        .withFinishedAt(undefined)
        .withWAFRWorkloadArn(undefined)
        .withExportRegion(undefined)
        .build();

      await repository.save(assessment);
      const bestPractice = BestPracticeMother.basic()
        .withChecked(false)
        .build();
      const question = QuestionMother.basic()
        .withBestPractices([bestPractice])
        .build();
      const pillar = PillarMother.basic().withQuestions([question]).build();

      const version = AssessmentVersionMother.basic()
        .withAssessmentId(assessment.id)
        .withVersion(assessment.latestVersionNumber)
        .withCreatedBy('new-user')
        .withCreatedAt(new Date('2026-01-02'))
        .withExecutionArn('new-arn')
        .withFinishedAt(new Date('2026-01-03'))
        .withPillars([pillar])
        .build();

      await repository.createVersion({
        assessmentVersion: version,
        organizationDomain: 'organization1',
      });

      const mergedAssessment = await repository.get({
        assessmentId: assessment.id,
        organizationDomain: 'organization1',
      });

      expect(mergedAssessment).toBeDefined();
      expect(mergedAssessment?.createdBy).toBe('new-user');
      expect(mergedAssessment?.createdAt).toEqual(new Date('2026-01-02'));
      expect(mergedAssessment?.executionArn).toBe('new-arn');
      expect(mergedAssessment?.name).toBe('Test Assessment');
      expect(mergedAssessment?.regions).toEqual(['us-east-1']);
      expect(mergedAssessment?.pillars).toHaveLength(1);
      expect(mergedAssessment?.pillars?.[0].id).toBe(pillar.id);
    });
  });

  describe('getAll', () => {
    it('should return a list of assessment if it exists', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withOrganization('organization1')
        .build();

      const assessmentVersion = AssessmentVersionMother.basic()
        .withAssessmentId(assessment.id)
        .withVersion(assessment.latestVersionNumber)
        .build();
      await repository.save(assessment);
      await repository.createVersion({
        assessmentVersion,
        organizationDomain: assessment.organization,
      });

      const fetchedAssessments = await repository.getAll({
        organizationDomain: assessment.organization,
      });

      expect(fetchedAssessments).toEqual({
        assessments: [assessment],
        nextToken: undefined,
      });
    });

    it('should return all assessments with matched search criteria', async () => {
      vitest.useFakeTimers();
      const { repository } = setup();

      const assessment1 = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .build();

      const assessmentVersion1 = AssessmentVersionMother.basic()
        .withAssessmentId(assessment1.id)
        .withVersion(assessment1.latestVersionNumber)
        .build();
      await repository.save(assessment1);
      await repository.createVersion({
        assessmentVersion: assessmentVersion1,
        organizationDomain: assessment1.organization,
      });

      const assessment2 = AssessmentMother.basic()
        .withId('2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .build();

      const assessmentVersion2 = AssessmentVersionMother.basic()
        .withAssessmentId(assessment2.id)
        .withVersion(assessment2.latestVersionNumber)
        .build();
      await repository.save(assessment2);
      await repository.createVersion({
        assessmentVersion: assessmentVersion2,
        organizationDomain: assessment2.organization,
      });

      const fetchedAssessments = await repository.getAll({
        organizationDomain: assessment1.organization,
        search: assessment1.id,
      });

      expect(fetchedAssessments).toEqual({
        assessments: [assessment1],
        nextToken: undefined,
      });
      vitest.useRealTimers();
    });

    it('should return all assessments within the limit', async () => {
      vitest.useFakeTimers();
      const { repository } = setup();

      const assessment1 = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .build();

      const assessmentVersion1 = AssessmentVersionMother.basic()
        .withAssessmentId(assessment1.id)
        .withVersion(assessment1.latestVersionNumber)
        .build();
      await repository.save(assessment1);
      await repository.createVersion({
        assessmentVersion: assessmentVersion1,
        organizationDomain: assessment1.organization,
      });

      vitest.advanceTimersByTime(1);

      const assessment2 = AssessmentMother.basic()
        .withId('2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .build();

      const assessmentVersion2 = AssessmentVersionMother.basic()
        .withAssessmentId(assessment2.id)
        .withVersion(assessment2.latestVersionNumber)
        .build();
      await repository.save(assessment2);
      await repository.createVersion({
        assessmentVersion: assessmentVersion2,
        organizationDomain: assessment2.organization,
      });

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
      vitest.useRealTimers();
    });

    it('should return all assessments after the next token', async () => {
      vitest.useFakeTimers();
      const { repository } = setup();

      const assessment1 = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .build();

      const assessmentVersion1 = AssessmentVersionMother.basic()
        .withAssessmentId(assessment1.id)
        .withVersion(assessment1.latestVersionNumber)
        .build();
      await repository.save(assessment1);
      await repository.createVersion({
        assessmentVersion: assessmentVersion1,
        organizationDomain: assessment1.organization,
      });

      vitest.advanceTimersByTime(1);

      const assessment2 = AssessmentMother.basic()
        .withId('2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .build();

      const assessmentVersion2 = AssessmentVersionMother.basic()
        .withAssessmentId(assessment2.id)
        .withVersion(assessment2.latestVersionNumber)
        .build();
      await repository.save(assessment2);
      await repository.createVersion({
        assessmentVersion: assessmentVersion2,
        organizationDomain: assessment2.organization,
      });

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
      vitest.useRealTimers();
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
      const assessmentVersion1 = AssessmentVersionMother.basic()
        .withAssessmentId(assessment1.id)
        .withVersion(assessment1.latestVersionNumber)
        .build();
      await repository.save(assessment1);
      await repository.createVersion({
        assessmentVersion: assessmentVersion1,
        organizationDomain: assessment1.organization,
      });

      const assessment2 = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization2')
        .build();

      const assessmentVersion2 = AssessmentVersionMother.basic()
        .withAssessmentId(assessment2.id)
        .withVersion(assessment2.latestVersionNumber)
        .build();
      await repository.save(assessment2);
      await repository.createVersion({
        assessmentVersion: assessmentVersion2,
        organizationDomain: assessment2.organization,
      });

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
      const date = new Date();

      const assessment = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .withName('Old Name')
        .withQuestionVersion('0.1')
        .withOpportunityId('old-opportunity-id')
        .withOpportunityCreatedAt(undefined)
        .build();
      const assessmentVersion = AssessmentVersionMother.basic()
        .withAssessmentId(assessment.id)
        .withVersion(assessment.latestVersionNumber)
        .build();
      await repository.save(assessment);
      await repository.createVersion({
        assessmentVersion,
        organizationDomain: assessment.organization,
      });

      await repository.update({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        assessmentBody: {
          name: 'New Name',
          questionVersion: '1.0',
          opportunityId: 'new-opportunity-id',
          opportunityCreatedAt: date,
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
          opportunityId: 'new-opportunity-id',
          opportunityCreatedAt: date,
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
      const assessmentVersion1 = AssessmentVersionMother.basic()
        .withAssessmentId(assessment1.id)
        .withVersion(assessment1.latestVersionNumber)
        .build();
      await repository.save(assessment1);
      await repository.createVersion({
        assessmentVersion: assessmentVersion1,
        organizationDomain: assessment1.organization,
      });

      const assessment2 = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization2')
        .withName('Old Name')
        .build();
      const assessmentVersion2 = AssessmentVersionMother.basic()
        .withAssessmentId(assessment2.id)
        .withVersion(assessment2.latestVersionNumber)
        .build();
      await repository.save(assessment2);
      await repository.createVersion({
        assessmentVersion: assessmentVersion2,
        organizationDomain: assessment2.organization,
      });

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
        .withOrganization('organization1')
        .withLatestVersionNumber(0)
        .build();
      const assessmentVersion = AssessmentVersionMother.basic()
        .withAssessmentId(assessment.id)
        .withVersion(assessment.latestVersionNumber)
        .withPillars([pillar])
        .build();
      await repository.save(assessment);
      await repository.createVersion({
        assessmentVersion,
        organizationDomain: assessment.organization,
      });
      await expect(
        repository.updatePillar({
          assessmentId: assessment.id,
          organizationDomain: assessment.organization,
          pillarId: pillar.id,
          version: assessment.latestVersionNumber,
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
        .withOrganization('organization1')
        .build();
      const assessmentVersion = AssessmentVersionMother.basic()
        .withAssessmentId(assessment.id)
        .withVersion(assessment.latestVersionNumber)
        .withPillars([pillar])
        .build();
      await repository.save(assessment);
      await repository.createVersion({
        assessmentVersion,
        organizationDomain: assessment.organization,
      });

      await repository.updateQuestion({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        version: assessment.latestVersionNumber,
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
        .build();
      const assessmentVersion1 = AssessmentVersionMother.basic()
        .withAssessmentId(assessment1.id)
        .withVersion(assessment1.latestVersionNumber)
        .withPillars([pillar1])
        .build();
      await repository.save(assessment1);
      await repository.createVersion({
        assessmentVersion: assessmentVersion1,
        organizationDomain: assessment1.organization,
      });

      const question2 = QuestionMother.basic()
        .withDisabled(false)
        .withNone(false)
        .build();
      const pillar2 = PillarMother.basic().withQuestions([question2]).build();
      const assessment2 = AssessmentMother.basic()
        .withId('2b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization2')
        .build();
      const assessmentVersion2 = AssessmentVersionMother.basic()
        .withAssessmentId(assessment2.id)
        .withVersion(assessment2.latestVersionNumber)
        .withPillars([pillar2])
        .build();
      await repository.save(assessment2);
      await repository.createVersion({
        assessmentVersion: assessmentVersion2,
        organizationDomain: assessment2.organization,
      });

      await repository.updateQuestion({
        assessmentId: assessment1.id,
        organizationDomain: assessment1.organization,
        version: assessment1.latestVersionNumber,
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
        .build();
      const assessmentVersion = AssessmentVersionMother.basic()
        .withAssessmentId(assessment.id)
        .withVersion(assessment.latestVersionNumber)
        .withPillars([pillar])
        .build();
      await repository.save(assessment);
      await repository.createVersion({
        assessmentVersion,
        organizationDomain: assessment.organization,
      });
      await expect(
        repository.updateBestPractice({
          assessmentId: assessment.id,
          organizationDomain: assessment.organization,
          version: assessment.latestVersionNumber,
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
      const assessmentVersion = AssessmentVersionMother.basic()
        .withAssessmentId(assessment.id)
        .withVersion(assessment.latestVersionNumber)
        .build();
      await repository.save(assessment);
      await repository.createVersion({
        assessmentVersion,
        organizationDomain: assessment.organization,
      });

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
      const assessmentVersion = AssessmentVersionMother.basic()
        .withAssessmentId(assessment.id)
        .withVersion(assessment.latestVersionNumber)
        .build();
      await repository.save(assessment);
      await repository.createVersion({
        assessmentVersion,
        organizationDomain: assessment.organization,
      });

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
      const { repository } = setup();
      const date = new Date();

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
      const { repository } = setup();
      const date = new Date();
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
      vitest.useFakeTimers();
      const { repository } = setup();
      const date = new Date();

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
      vitest.useRealTimers();
    });
  });

  describe('countAssessmentsByYear', () => {
    it('should return 0 if no assessments exist for the given year', async () => {
      const { repository } = setup();
      const date = new Date();

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
      const { repository } = setup();
      const date = new Date();

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
      const { repository } = setup();
      const date = new Date();
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

  describe('saveBillingInformation', () => {
    it('should create new billing information when it does not exist', async () => {
      const { repository } = setup();
      const date = new Date();
      const assessment = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .withBillingInformation(undefined)
        .build();
      const assessmentVersion = AssessmentVersionMother.basic()
        .withAssessmentId(assessment.id)
        .withVersion(assessment.latestVersionNumber)
        .build();
      await repository.save(assessment);
      await repository.createVersion({
        assessmentVersion,
        organizationDomain: assessment.organization,
      });

      const newBillingInformation = {
        billingPeriodStartDate: new Date(
          date.getTime() - 30 * 24 * 60 * 60 * 1000,
        ),
        billingPeriodEndDate: date,
        totalCost: '123.45',
        servicesCost: [
          { serviceName: 'AWS EC2', cost: '50.00' },
          { serviceName: 'AWS S3', cost: '73.45' },
        ],
      };

      await repository.saveBillingInformation({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        billingInformation: newBillingInformation,
      });

      const updatedAssessment = await repository.get({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
      });

      expect(updatedAssessment?.billingInformation).toBeDefined();
      expect(updatedAssessment?.billingInformation).toEqual(
        newBillingInformation,
      );
    });

    it('should update existing billing information', async () => {
      const { repository } = setup();
      const date = new Date();
      const existingBillingInformation = {
        billingPeriodStartDate: new Date(
          date.getTime() - 60 * 24 * 60 * 60 * 1000,
        ),
        billingPeriodEndDate: new Date(
          date.getTime() - 30 * 24 * 60 * 60 * 1000,
        ),
        totalCost: '50.00',
        servicesCost: [{ serviceName: 'AWS EC2', cost: '50.00' }],
      };

      const assessment = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .withBillingInformation(existingBillingInformation)
        .build();
      const assessmentVersion = AssessmentVersionMother.basic()
        .withAssessmentId(assessment.id)
        .withVersion(assessment.latestVersionNumber)
        .build();
      await repository.save(assessment);
      await repository.createVersion({
        assessmentVersion,
        organizationDomain: assessment.organization,
      });

      const updatedBillingInformation = {
        billingPeriodStartDate: new Date(
          date.getTime() - 30 * 24 * 60 * 60 * 1000,
        ),
        billingPeriodEndDate: date,
        totalCost: '150.75',
        servicesCost: [
          { serviceName: 'AWS EC2', cost: '100.00' },
          { serviceName: 'AWS Lambda', cost: '50.75' },
        ],
      };

      await repository.saveBillingInformation({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        billingInformation: updatedBillingInformation,
      });

      const updatedAssessment = await repository.get({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
      });

      expect(updatedAssessment?.billingInformation).toBeDefined();
      expect(updatedAssessment?.billingInformation).toEqual(
        updatedBillingInformation,
      );
      expect(updatedAssessment?.billingInformation?.totalCost).toBe('150.75');
      expect(updatedAssessment?.billingInformation?.servicesCost).toHaveLength(
        2,
      );
    });

    it('should handle empty services cost array', async () => {
      const { repository } = setup();
      const date = new Date();
      const assessment = AssessmentMother.basic()
        .withId('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')
        .withOrganization('organization1')
        .build();
      const assessmentVersion = AssessmentVersionMother.basic()
        .withAssessmentId(assessment.id)
        .withVersion(assessment.latestVersionNumber)
        .build();
      await repository.save(assessment);
      await repository.createVersion({
        assessmentVersion,
        organizationDomain: assessment.organization,
      });

      const billingInformationWithEmptyServices = {
        billingPeriodStartDate: new Date(
          date.getTime() - 30 * 24 * 60 * 60 * 1000,
        ),
        billingPeriodEndDate: date,
        totalCost: '0.00',
        servicesCost: [],
      };

      await repository.saveBillingInformation({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        billingInformation: billingInformationWithEmptyServices,
      });

      const updatedAssessment = await repository.get({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
      });

      expect(updatedAssessment?.billingInformation).toBeDefined();
      expect(updatedAssessment?.billingInformation?.servicesCost).toEqual([]);
      expect(updatedAssessment?.billingInformation?.totalCost).toBe('0.00');
    });
  });

  describe('createVersion', () => {
    it('should create a version for an assessment', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withOrganization('organization1')
        .build();
      await repository.save(assessment);

      const assessmentVersion = AssessmentVersionMother.basic()
        .withVersion(2)
        .withCreatedBy('user1')
        .build();

      await repository.createVersion({
        assessmentVersion: assessmentVersion,
        organizationDomain: 'organization1',
      });

      const retrievedVersion = await repository.getVersion({
        assessmentId: assessment.id,
        version: 2,
        organizationDomain: assessment.organization,
      });

      expect(retrievedVersion).toBeDefined();
      expect(retrievedVersion?.version).toBe(2);
      expect(retrievedVersion?.assessmentId).toBe(assessment.id);
    });

    it('should allow creating multiple versions for the same assessment', async () => {
      vi.useFakeTimers();
      const { repository } = setup();
      const date = new Date();
      const assessment = AssessmentMother.basic()
        .withOrganization('organization1')
        .build();
      await repository.save(assessment);

      const assessmentVersion1 = AssessmentVersionMother.basic()
        .withAssessmentId(assessment.id)
        .withVersion(1)
        .withCreatedBy('user1')
        .withCreatedAt(date)
        .build();

      const assessmentVersion2 = AssessmentVersionMother.basic()
        .withAssessmentId(assessment.id)
        .withVersion(2)
        .withCreatedBy('user2')
        .withCreatedAt(new Date(date.getTime() + 24 * 60 * 60 * 1000))
        .withFinishedAt(new Date(date.getTime() + 24 * 60 * 60 * 2000))
        .build();

      await repository.createVersion({
        assessmentVersion: assessmentVersion1,
        organizationDomain: assessment.organization,
      });

      await repository.createVersion({
        assessmentVersion: assessmentVersion2,
        organizationDomain: assessment.organization,
      });

      const retrievedVersion1 = await repository.getVersion({
        assessmentId: assessment.id,
        version: 1,
        organizationDomain: assessment.organization,
      });

      const retrievedVersion2 = await repository.getVersion({
        assessmentId: assessment.id,
        version: 2,
        organizationDomain: assessment.organization,
      });

      expect(retrievedVersion1?.version).toBe(1);
      expect(retrievedVersion1?.createdBy).toBe('user1');
      expect(retrievedVersion2?.version).toBe(2);
      expect(retrievedVersion2?.createdBy).toBe('user2');
      expect(retrievedVersion2?.finishedAt).toBeDefined();
      vi.useRealTimers();
    });

    it('should scope versions by organization', async () => {
      const { repository } = setup();

      const assessment1 = AssessmentMother.basic()
        .withOrganization('organization1')
        .build();
      await repository.save(assessment1);

      const version1 = AssessmentVersionMother.basic()
        .withAssessmentId(assessment1.id)
        .withVersion(assessment1.latestVersionNumber)
        .build();

      await repository.createVersion({
        assessmentVersion: version1,
        organizationDomain: assessment1.organization,
      });

      const fetchedAssessmentVersion1 = await repository.getVersion({
        assessmentId: assessment1.id,
        version: version1.version,
        organizationDomain: assessment1.organization,
      });
      const fetchedAssessmentVersion2 = await repository.getVersion({
        assessmentId: assessment1.id,
        version: version1.version,
        organizationDomain: 'organization2',
      });

      expect(fetchedAssessmentVersion1).toBeDefined();
      expect(fetchedAssessmentVersion2).toBeUndefined();
    });
  });

  describe('getVersion', () => {
    it('should return undefined for non-existent version', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withOrganization('organization1')
        .build();
      await repository.save(assessment);

      const version = await repository.getVersion({
        assessmentId: assessment.id,
        version: 999,
        organizationDomain: assessment.organization,
      });

      expect(version).toBeUndefined();
    });

    it('should return undefined for non-existent assessment', async () => {
      const { repository } = setup();

      const version = await repository.getVersion({
        assessmentId: '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
        version: 1,
        organizationDomain: 'organization1',
      });

      expect(version).toBeUndefined();
    });

    it('should retrieve version', async () => {
      const { repository } = setup();
      const bestPractice = BestPracticeMother.basic()
        .withChecked(false)
        .build();
      const question = QuestionMother.basic()
        .withBestPractices([bestPractice])
        .build();
      const pillar = PillarMother.basic().withQuestions([question]).build();
      const assessment = AssessmentMother.basic()
        .withOrganization('organization1')
        .build();
      await repository.save(assessment);

      const version = AssessmentVersionMother.basic()
        .withVersion(1)
        .withAssessmentId(assessment.id)
        .withPillars([pillar])
        .build();

      await repository.createVersion({
        assessmentVersion: version,
        organizationDomain: assessment.organization,
      });

      const retrievedVersion = await repository.getVersion({
        assessmentId: assessment.id,
        version: 1,
        organizationDomain: assessment.organization,
      });

      expect(retrievedVersion).toBeDefined();
      expect(retrievedVersion?.pillars).toHaveLength(1);
      expect(retrievedVersion?.pillars?.[0].id).toBe(pillar.id);
      expect(
        retrievedVersion?.pillars?.[0].questions[0].bestPractices[0].id,
      ).toBe(bestPractice.id);
    });
  });

  describe('updateVersion', () => {
    it('should update version fields', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withOrganization('organization1')
        .build();
      await repository.save(assessment);

      const version = AssessmentVersionMother.basic()
        .withVersion(1)
        .withAssessmentId(assessment.id)
        .withExecutionArn('old-execution-arn')
        .withFinishedAt(undefined)
        .withExportRegion('old-region')
        .build();

      await repository.createVersion({
        assessmentVersion: version,
        organizationDomain: assessment.organization,
      });

      await repository.updateVersion({
        assessmentId: assessment.id,
        version: 1,
        organizationDomain: assessment.organization,
        assessmentVersionBody: {
          executionArn: 'updated-execution-arn',
          finishedAt: new Date('2024-01-01'),
          error: { cause: 'Some error', error: 'Error details' },
          wafrWorkloadArn: 'updated-workload-arn',
          exportRegion: 'new-region',
        },
      });

      const updatedVersion = await repository.getVersion({
        assessmentId: assessment.id,
        version: 1,
        organizationDomain: assessment.organization,
      });

      expect(updatedVersion?.executionArn).toBe('updated-execution-arn');
      expect(updatedVersion?.finishedAt).toEqual(new Date('2024-01-01'));
      expect(updatedVersion?.error).toEqual({
        cause: 'Some error',
        error: 'Error details',
      });
      expect(updatedVersion?.wafrWorkloadArn).toBe('updated-workload-arn');
      expect(updatedVersion?.exportRegion).toBe('new-region');
    });

    it('should not affect other versions when updating one', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic()
        .withOrganization('organization1')

        .build();
      await repository.save(assessment);

      const version1 = AssessmentVersionMother.basic()
        .withVersion(1)
        .withAssessmentId(assessment.id)
        .withExecutionArn('old-execution-arn')
        .withCreatedBy('user1')
        .build();

      const version2 = AssessmentVersionMother.basic()
        .withVersion(2)
        .withAssessmentId(assessment.id)
        .withExecutionArn('old-execution-arn')
        .withCreatedBy('user2')
        .build();

      await repository.createVersion({
        assessmentVersion: version1,
        organizationDomain: 'organization1',
      });

      await repository.createVersion({
        assessmentVersion: version2,
        organizationDomain: 'organization1',
      });

      await repository.updateVersion({
        assessmentId: assessment.id,
        version: 1,
        organizationDomain: 'organization1',
        assessmentVersionBody: {
          executionArn: 'updated-execution-arn',
        },
      });

      const updatedVersion1 = await repository.getVersion({
        assessmentId: assessment.id,
        version: 1,
        organizationDomain: 'organization1',
      });

      const updatedVersion2 = await repository.getVersion({
        assessmentId: assessment.id,
        version: 2,
        organizationDomain: 'organization1',
      });

      expect(updatedVersion1?.executionArn).toBe('updated-execution-arn');
      expect(updatedVersion2?.executionArn).toBe('old-execution-arn');
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  return { repository: new AssessmentsRepositorySQL() };
};
