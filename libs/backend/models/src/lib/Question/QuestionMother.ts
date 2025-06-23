import type { BestPractice } from '../BestPractice';
import type { Question } from './Question';

export class QuestionMother {
  private data: Question;

  private constructor(data: Question) {
    this.data = data;
  }

  public static basic(): QuestionMother {
    return new QuestionMother({
      bestPractices: [],
      disabled: false,
      id: 'question-id',
      label: 'Question Label',
      none: false,
      primaryId: 'primary-id',
    });
  }

  public withBestPractices(bestPractices: BestPractice[]): QuestionMother {
    this.data.bestPractices = bestPractices;
    return this;
  }

  public withDisabled(disabled: boolean): QuestionMother {
    this.data.disabled = disabled;
    return this;
  }

  public withId(id: string): QuestionMother {
    this.data.id = id;
    return this;
  }

  public withLabel(label: string): QuestionMother {
    this.data.label = label;
    return this;
  }

  public withNone(none: boolean): QuestionMother {
    this.data.none = none;
    return this;
  }

  public withPrimaryId(primaryId: string): QuestionMother {
    this.data.primaryId = primaryId;
    return this;
  }

  public build(): Question {
    return this.data;
  }
}
