import { type QuestionSet } from '@backend/models';
import { type QuestionSetPort } from '@backend/ports';
import { createInjectionToken } from '@shared/di-container';

export class FakeQuestionSetService implements QuestionSetPort {
  public get(): QuestionSet {
    return {
      pillars: [],
      version: '1.0.0',
    };
  }
}

export const tokenFakeQuestionSetService =
  createInjectionToken<FakeQuestionSetService>('FakeQuestionSetService', {
    useClass: FakeQuestionSetService,
  });
