import {
  AIBestPracticeAssociation,
  AIBestPracticeMetadata,
  QuestionSet,
} from '@backend/models';
import { AIBestPracticePort } from '@backend/ports';
import { createInjectionToken } from '@shared/di-container';

export class AIBestPracticeService implements AIBestPracticePort {
  createAIBestPracticeMetadatas(args: {
    questionSet: QuestionSet['data'];
  }): AIBestPracticeMetadata[] {
    const aiBestPracticeMetadata: AIBestPracticeMetadata[] = [];
    let globalId = 1;

    for (const pillar of args.questionSet) {
      for (const question of pillar.questions) {
        for (const bestPractice of question.bestPractices) {
          aiBestPracticeMetadata.push({
            globalId: globalId++,
            pillarLabel: pillar.label,
            questionLabel: question.label,
            bestPracticeLabel: bestPractice.label,
            bestPracticeDescription: bestPractice.description,
          });
        }
      }
    }
    return aiBestPracticeMetadata;
  }

  createAIBestPracticeAssociations(args: {
    questionSet: QuestionSet['data'];
  }): Record<string, AIBestPracticeAssociation> {
    const aiBestPracticeAssociation: Record<string, AIBestPracticeAssociation> =
      {};
    let globalId = 1;

    for (const pillar of args.questionSet) {
      for (const question of pillar.questions) {
        for (const bestPractice of question.bestPractices) {
          aiBestPracticeAssociation[globalId.toString()] = {
            globalId: globalId++,
            pillarId: pillar.id,
            questionId: question.id,
            bestPracticeId: bestPractice.id,
            bestPracticeFindingNumberIds: [],
          };
        }
      }
    }
    return aiBestPracticeAssociation;
  }
}

export const tokenAIBestPracticeService =
  createInjectionToken<AIBestPracticeService>('AIBestPracticeService', {
    useClass: AIBestPracticeService,
  });
