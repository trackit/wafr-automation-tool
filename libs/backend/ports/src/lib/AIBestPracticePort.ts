import {
  AIBestPracticeAssociation,
  AIBestPracticeMetadata,
  QuestionSet,
} from '@backend/models';

export interface AIBestPracticePort {
  createAIBestPracticeMetadata(args: {
    questionSet: QuestionSet['data'];
  }): AIBestPracticeMetadata[];
  createAIBestPracticeAssociation(args: {
    questionSet: QuestionSet['data'];
  }): Record<string, AIBestPracticeAssociation>;
}
