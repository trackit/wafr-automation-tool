import { QuestionSet } from '@backend/models';
import { QuestionSetPort } from '@backend/ports';
import { createInjectionToken } from '@shared/di-container';

export class FakeQuestionSetService implements QuestionSetPort {
  public get(): QuestionSet {
    return {
      data: [],
      version: '1.0.0',
    };
  }
}

export const tokenFakeQuestionSetService =
  createInjectionToken<FakeQuestionSetService>('FakeQuestionSetService', {
    useClass: FakeQuestionSetService,
  });
