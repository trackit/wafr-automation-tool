import { QuestionSet } from '@backend/models';

export interface QuestionSetPort {
  get(): QuestionSet;
}
