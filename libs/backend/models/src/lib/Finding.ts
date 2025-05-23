export interface Finding {
  id: string;
}

export class FindingMother {
  private data: Finding;

  private constructor(data: Finding) {
    this.data = data;
  }

  public static basic(): FindingMother {
    return new FindingMother({
      id: 'finding-id',
    });
  }

  public withId(id: string): FindingMother {
    this.data.id = id;
    return this;
  }

  public build(): Finding {
    return this.data;
  }
}
