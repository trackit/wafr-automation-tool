import {
  registerTestInfrastructure,
  tokenFakeAssessmentsRepository,
  tokenFakeObjectsStorage,
  tokenFakeQuestionSetService,
} from '@backend/infrastructure';
import { inject, reset } from '@shared/di-container';

import {
  AIBestPracticeAssociation,
  AssessmentMother,
  BestPracticeMother,
  FindingMother,
  PillarMother,
  QuestionMother,
} from '@backend/models';
import { StoreResultsUseCaseImpl } from './StoreResultsUseCase';

describe('StoreResultsUseCase', () => {
  it('should extract scanning tool and chunkId from prompt uri', async () => {
    const { useCase } = setup();

    expect(useCase.parseKey('scanningtool_chunkId')).toEqual({
      scanningTool: 'scanningtool',
      chunkId: 'chunkId',
    });
  });

  it('should retrieve findings with chunkId and scanning tool variables', async () => {
    const { useCase, fakeObjectsStorage } = setup();

    const finding = FindingMother.basic().build();

    fakeObjectsStorage.put({
      key: 'assessments/assessment_id/chunks/scanningtool_chunkId.json',
      body: JSON.stringify([finding]),
    });

    await expect(
      useCase.retrieveFindings('assessment_id', 'scanningtool_chunkId')
    ).resolves.toEqual([finding]);
  });

  describe('storeBestPractices', () => {
    it('should update the best practice results variables with the list of finding ids', async () => {
      const { useCase, fakeAssessmentsRepository } = setup();

      const assessment = AssessmentMother.basic()
        .withId('assessment_id')
        .withOrganization('organization')
        .withFindings([
          PillarMother.basic()
            .withId('pillarId')
            .withQuestions([
              QuestionMother.basic()
                .withId('questionId')
                .withBestPractices([
                  BestPracticeMother.basic().withId('bestPracticeId').build(),
                ])
                .build(),
            ])
            .build(),
        ])
        .build();
      fakeAssessmentsRepository.save(assessment);

      const aiBestPracticeAssociations: Record<
        string,
        AIBestPracticeAssociation
      > = {
        0: {
          globalId: 0,
          pillarId: 'pillarId',
          questionId: 'questionId',
          bestPracticeId: 'bestPracticeId',
          bestPracticeFindingNumberIds: [],
        },
      };
      const scanningTool = 'scanningtool';

      await expect(
        useCase.storeBestPractices(
          'assessment_id',
          'organization',
          scanningTool,
          [
            {
              id: 0,
              start: 1,
              end: 3,
            },
          ],
          aiBestPracticeAssociations
        )
      ).resolves.toBeUndefined();
      expect(
        aiBestPracticeAssociations[0].bestPracticeFindingNumberIds
      ).toEqual([1, 2, 3]);

      const updatedAssessment = await fakeAssessmentsRepository.get({
        assessmentId: 'assessment_id',
        organization: 'organization',
      });
      expect(
        updatedAssessment?.findings?.[0].questions[0].bestPractices[0].results
      ).toEqual([
        `${scanningTool}#1`,
        `${scanningTool}#2`,
        `${scanningTool}#3`,
      ]);
    });

    it('shoud throw an error if the best practice is not found', async () => {
      const { useCase, fakeAssessmentsRepository } = setup();

      const assessment = AssessmentMother.basic()
        .withId('assessment_id')
        .withOrganization('organization')
        .withFindings([
          PillarMother.basic()
            .withId('pillarId')
            .withQuestions([
              QuestionMother.basic()
                .withId('questionId')
                .withBestPractices([
                  BestPracticeMother.basic().withId('bestPracticeId').build(),
                ])
                .build(),
            ])
            .build(),
        ])
        .build();
      fakeAssessmentsRepository.save(assessment);

      const aiBestPracticeAssociations: Record<
        string,
        AIBestPracticeAssociation
      > = {};
      const scanningTool = 'scanningtool';

      await expect(
        useCase.storeBestPractices(
          'assessment_id',
          'organization',
          scanningTool,
          [
            {
              id: 0,
              start: 1,
              end: 3,
            },
          ],
          aiBestPracticeAssociations
        )
      ).rejects.toThrowError(
        `Best practice association for AI finding 0 not found`
      );
    });
  });

  describe('storeFindings', () => {
    it('should save the findings with associated best practices', async () => {
      const { useCase, fakeAssessmentsRepository } = setup();

      const findings = [FindingMother.basic().withId('scanningtool#1').build()];
      const assessment = AssessmentMother.basic()
        .withId('assessment_id')
        .withOrganization('organization')
        .withFindings([
          PillarMother.basic()
            .withId('pillarId')
            .withQuestions([
              QuestionMother.basic()
                .withId('questionId')
                .withBestPractices([
                  BestPracticeMother.basic()
                    .withId('bestPracticeId')
                    .withResults([`${findings[0].id}`])
                    .build(),
                ])
                .build(),
            ])
            .build(),
        ])
        .build();
      fakeAssessmentsRepository.save(assessment);

      const aiBestPracticeAssociations: Record<
        string,
        AIBestPracticeAssociation
      > = {
        0: {
          globalId: 0,
          pillarId: 'pillarId',
          questionId: 'questionId',
          bestPracticeId: 'bestPracticeId',
          bestPracticeFindingNumberIds: [1],
        },
      };

      await expect(
        useCase.storeFindings(
          'assessment_id',
          'organization',
          findings,
          aiBestPracticeAssociations
        )
      ).resolves.toBeUndefined();

      const createdFinding = await fakeAssessmentsRepository.getFinding({
        assessmentId: 'assessment_id',
        organization: 'organization',
        findingId: findings[0].id,
      });
      expect(createdFinding).toEqual(findings[0]);
      expect(createdFinding?.bestPractices).toEqual(
        'pillarId#questionId#bestPracticeId'
      );
    });

    it('should not save the findings if no best practices are associated', async () => {
      const { useCase, fakeAssessmentsRepository } = setup();

      const findings = [FindingMother.basic().withId('scanningtool#1').build()];
      const assessment = AssessmentMother.basic()
        .withId('assessment_id')
        .withOrganization('organization')
        .withFindings([
          PillarMother.basic()
            .withId('pillarId')
            .withQuestions([
              QuestionMother.basic()
                .withId('questionId')
                .withBestPractices([
                  BestPracticeMother.basic()
                    .withId('bestPracticeId')
                    .withResults([])
                    .build(),
                ])
                .build(),
            ])
            .build(),
        ])
        .build();
      fakeAssessmentsRepository.save(assessment);

      const aiBestPracticeAssociations: Record<
        string,
        AIBestPracticeAssociation
      > = {
        0: {
          globalId: 0,
          pillarId: 'pillarId',
          questionId: 'questionId',
          bestPracticeId: 'bestPracticeId',
          bestPracticeFindingNumberIds: [],
        },
      };

      await expect(
        useCase.storeFindings(
          'assessment_id',
          'organization',
          findings,
          aiBestPracticeAssociations
        )
      ).resolves.toBeUndefined();

      const createdFinding = await fakeAssessmentsRepository.getFinding({
        assessmentId: 'assessment_id',
        organization: 'organization',
        findingId: findings[0].id,
      });
      expect(createdFinding).toBeUndefined();
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
  const fakeObjectsStorage = inject(tokenFakeObjectsStorage);
  vitest.spyOn(fakeObjectsStorage, 'get');
  const fakeAssessmentsRepository = inject(tokenFakeAssessmentsRepository);
  const fakeQuestionSetService = inject(tokenFakeQuestionSetService);
  return {
    useCase: new StoreResultsUseCaseImpl(),
    fakeObjectsStorage,
    fakeAssessmentsRepository,
    fakeQuestionSetService,
  };
};
