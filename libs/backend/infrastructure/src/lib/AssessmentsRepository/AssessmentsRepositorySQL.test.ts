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

import { tokenIdGenerator } from '../IdGenerator';
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
                    .withFindings([])
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
        .withRegions(['us-west-1'])
        .withRoleArn('arn:aws:iam::123456789012:role/AssessmentRole')
        .withFinished(true)
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
        .withQuestionVersion('0.1')
        .withExecutionArn('old-execution-arn')
        .withFinished(false)
        .build();
      await repository.save(assessment);

      await repository.update({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
        assessmentBody: {
          name: 'New Name',
          questionVersion: '1.0',
          executionArn: 'new-execution-arn',
          finished: true,
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
          executionArn: 'new-execution-arn',
          finished: true,
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
        })
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
        expect.objectContaining({ id: question.id, disabled: true, none: true })
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
        })
      );
      expect(updatedAssessment2?.pillars?.[0]?.questions?.[0]).toEqual(
        expect.objectContaining({
          id: question2.id,
          disabled: false,
          none: false,
        })
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
        })
      ).resolves.not.toThrow();
      const updatedAssessment = await repository.get({
        assessmentId: assessment.id,
        organizationDomain: assessment.organization,
      });
      expect(
        updatedAssessment?.pillars?.[0].questions?.[0].bestPractices?.[0]
          .checked
      ).toBe(true);
    });
  });

  describe('updateFileExport', () => {
    it('should update the file export for an export type', async () => {
      const { repository } = setup();

      const assessmentFileExport = AssessmentFileExportMother.basic()
        .withStatus(AssessmentFileExportStatus.NOT_STARTED)
        .build();
      const assessment = AssessmentMother.basic()
        .withFileExports([assessmentFileExport])
        .build();
      await repository.save(assessment);

      const fileExport = AssessmentFileExportMother.basic()
        .withId(assessmentFileExport.id)
        .withStatus(AssessmentFileExportStatus.IN_PROGRESS)
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

    it('should create the file export for an export type if it does not exist', async () => {
      const { repository } = setup();

      const assessment = AssessmentMother.basic().withFileExports([]).build();
      await repository.save(assessment);

      const fileExport = AssessmentFileExportMother.basic()
        .withType(AssessmentFileExportType.PDF)
        .build();

      await repository.saveFileExport({
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
        .build();
      const assessment = AssessmentMother.basic()
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
});

const setup = () => {
  reset();
  registerTestInfrastructure();

  return {
    repository: new AssessmentsRepositorySQL(),
    idGenerator: inject(tokenIdGenerator),
  };
};
