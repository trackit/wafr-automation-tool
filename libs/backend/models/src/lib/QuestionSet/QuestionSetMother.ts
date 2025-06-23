import type { Pillar } from '../Pillar';
import type { QuestionSet } from './QuestionSet';

export class QuestionSetMother {
  private data: QuestionSet;

  private constructor(data: QuestionSet) {
    this.data = data;
  }

  public static basic(): QuestionSetMother {
    return new QuestionSetMother({
      pillars: [],
      version: 'version',
    });
  }

  public withPillars(pillars: Pillar[]): QuestionSetMother {
    this.data.pillars = pillars;
    return this;
  }

  public withVersion(version: string): QuestionSetMother {
    this.data.version = version;
    return this;
  }

  public build(): QuestionSet {
    return this.data;
  }
}
