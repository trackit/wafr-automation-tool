import { AIFindingAssociation } from './AI';

export class AIFindingAssociationMother {
  private data: AIFindingAssociation;

  private constructor(data: AIFindingAssociation) {
    this.data = data;
  }

  public static basic(): AIFindingAssociationMother {
    return new AIFindingAssociationMother({
      id: 1,
      start: 1,
      end: 1,
    });
  }

  public withId(id: number): AIFindingAssociationMother {
    this.data.id = id;
    return this;
  }

  public withStart(start: number): AIFindingAssociationMother {
    this.data.start = start;
    return this;
  }

  public withEnd(end: number): AIFindingAssociationMother {
    this.data.end = end;
    return this;
  }

  public build(): AIFindingAssociation {
    return this.data;
  }
}
