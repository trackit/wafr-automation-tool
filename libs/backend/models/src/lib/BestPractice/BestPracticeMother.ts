import { SeverityType } from '../Finding';
import type { BestPractice } from './BestPractice';

export class BestPracticeMother {
  private data: BestPractice;

  private constructor(data: BestPractice) {
    this.data = data;
  }

  public static basic(): BestPracticeMother {
    return new BestPracticeMother({
      description: 'This is a description of the best practice.',
      id: 'best-practice-id',
      label: 'Best Practice Label',
      primaryId: 'primary-id',
      risk: SeverityType.Medium,
      checked: true,
    });
  }

  public withDescription(description: string): BestPracticeMother {
    this.data.description = description;
    return this;
  }

  public withId(id: string): BestPracticeMother {
    this.data.id = id;
    return this;
  }

  public withLabel(label: string): BestPracticeMother {
    this.data.label = label;
    return this;
  }

  public withPrimaryId(primaryId: string): BestPracticeMother {
    this.data.primaryId = primaryId;
    return this;
  }

  public withRisk(risk: SeverityType): BestPracticeMother {
    this.data.risk = risk;
    return this;
  }

  public withChecked(checked: boolean): BestPracticeMother {
    this.data.checked = checked;
    return this;
  }

  public build(): BestPractice {
    return this.data;
  }
}
