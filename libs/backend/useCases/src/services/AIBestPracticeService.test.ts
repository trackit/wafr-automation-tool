import { registerTestInfrastructure } from '@backend/infrastructure';
import {
  BestPracticeMother,
  PillarMother,
  QuestionMother,
  QuestionSetMother,
} from '@backend/models';
import { reset } from '@shared/di-container';
import { AIBestPracticeService } from './AIBestPracticeService';

describe('AIBestPracticeService Service', () => {
  describe('createAIBestPracticeMetadata', () => {
    it('should create AI best practice metadata', async () => {
      setup();

      const questionSet = QuestionSetMother.basic()
        .withPillars([
          PillarMother.basic()
            .withLabel('Pillar')
            .withQuestions([
              QuestionMother.basic()
                .withLabel('Question')
                .withBestPractices([
                  BestPracticeMother.basic()
                    .withLabel('Best Practice')
                    .withDescription('Best Practice Description')
                    .build(),
                ])
                .build(),
            ])
            .build(),
        ])
        .build();

      const aiBestPracticeMetadata =
        AIBestPracticeService.createAIBestPracticeMetadatas({
          questionSetData: questionSet.pillars,
        });

      expect(aiBestPracticeMetadata).toHaveLength(1);
      expect(aiBestPracticeMetadata[0]).toEqual({
        globalId: 1,
        pillarLabel: 'Pillar',
        questionLabel: 'Question',
        bestPracticeLabel: 'Best Practice',
        bestPracticeDescription: 'Best Practice Description',
      });
    });
  });
  describe('createAIBestPracticeAssociation', () => {
    it('should create AI best practice association', async () => {
      setup();

      const questionSet = QuestionSetMother.basic()
        .withPillars([
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

      const aiBestPracticeAssociation =
        AIBestPracticeService.createAIBestPracticeAssociations({
          questionSetData: questionSet.pillars,
        });

      expect(aiBestPracticeAssociation).toHaveProperty('1');
      expect(aiBestPracticeAssociation['1']).toEqual({
        globalId: 1,
        pillarId: 'pillarId',
        questionId: 'questionId',
        bestPracticeId: 'bestPracticeId',
        bestPracticeFindingNumberIds: [],
      });
    });
  });
});

const setup = () => {
  reset();
  registerTestInfrastructure();
};
