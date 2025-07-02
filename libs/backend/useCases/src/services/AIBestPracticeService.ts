import {
  AIBestPracticeAssociation,
  AIBestPracticeMetadata,
  Pillar,
} from '@backend/models';

export class AIBestPracticeService {
  public static createAIBestPracticeMetadatas(args: {
    questionSetData: Pillar[];
  }): AIBestPracticeMetadata[] {
    const aiBestPracticeMetadata: AIBestPracticeMetadata[] = [];
    let id = 1;

    for (const pillar of args.questionSetData) {
      for (const question of pillar.questions) {
        for (const bestPractice of question.bestPractices) {
          aiBestPracticeMetadata.push({
            id: id++,
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

  public static createAIBestPracticeAssociations(args: {
    questionSetData: Pillar[];
  }): Record<string, AIBestPracticeAssociation> {
    const aiBestPracticeAssociation: Record<string, AIBestPracticeAssociation> =
      {};
    let id = 1;

    for (const pillar of args.questionSetData) {
      for (const question of pillar.questions) {
        for (const bestPractice of question.bestPractices) {
          aiBestPracticeAssociation[id.toString()] = {
            id: id++,
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
