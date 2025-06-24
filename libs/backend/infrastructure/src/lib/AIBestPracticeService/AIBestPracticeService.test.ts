import {
  BestPracticeMother,
  PillarMother,
  QuestionMother,
  QuestionSetMother,
} from '@backend/models';
import { reset } from '@shared/di-container';
import { registerTestInfrastructure } from '../registerTestInfrastructure';
import { AIBestPracticeService } from './AIBestPracticeService';

describe('AIBestPracticeService Infrastructure', () => {
  describe('createAIBestPracticeMetadata', () => {
    it('should create AI best practice metadata', async () => {
      const { aiBestPracticeService } = setup();

      const questionSet = QuestionSetMother.basic()
        .withData([
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
        aiBestPracticeService.createAIBestPracticeMetadatas({
          questionSet: questionSet.data,
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
      const { aiBestPracticeService } = setup();

      const questionSet = QuestionSetMother.basic()
        .withData([
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
        aiBestPracticeService.createAIBestPracticeAssociations({
          questionSet: questionSet.data,
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
  return {
    aiBestPracticeService: new AIBestPracticeService(),
  };
};
