import type { QuestionSet } from './QuestionSet';

export class QuestionSetMother {
  private data: QuestionSet;

  private constructor(data: QuestionSet) {
    this.data = data;
  }

  public static basic(): QuestionSetMother {
    return new QuestionSetMother({
      data: [],
      version: 'version',
    });
  }

  public withData(data: QuestionSet['data']): QuestionSetMother {
    this.data.data = data;
    return this;
  }

  public withVersion(version: QuestionSet['version']): QuestionSetMother {
    this.data.version = version;
    return this;
  }

  public build(): QuestionSet {
    return this.data;
  }
}
