import type { Question } from '../Question';
import type { Pillar } from './Pillar';

export class PillarMother {
  private data: Pillar;

  private constructor(data: Pillar) {
    this.data = data;
  }

  public static basic(): PillarMother {
    return new PillarMother({
      disabled: false,
      id: 'pillar-id',
      label: 'Pillar Label',
      primaryId: 'primary-id',
      questions: {},
    });
  }

  public withDisabled(disabled: boolean): PillarMother {
    this.data.disabled = disabled;
    return this;
  }

  public withId(id: string): PillarMother {
    this.data.id = id;
    return this;
  }

  public withLabel(label: string): PillarMother {
    this.data.label = label;
    return this;
  }

  public withPrimaryId(primaryId: string): PillarMother {
    this.data.primaryId = primaryId;
    return this;
  }

  public withQuestions(questions: Record<string, Question>): PillarMother {
    this.data.questions = questions;
    return this;
  }

  public build(): Pillar {
    return this.data;
  }
}
