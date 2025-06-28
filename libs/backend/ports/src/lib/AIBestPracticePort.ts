import {
  AIBestPracticeAssociation,
  AIBestPracticeMetadata,
  QuestionSet,
} from '@backend/models';

export interface AIBestPracticePort {
  createAIBestPracticeMetadatas(args: {
    questionSet: QuestionSet['data'];
  }): AIBestPracticeMetadata[];
  createAIBestPracticeAssociations(args: {
    questionSet: QuestionSet['data'];
  }): Record<string, AIBestPracticeAssociation>;
}
