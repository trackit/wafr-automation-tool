import { Pillar } from '../models';
import { Milestone } from './Milestone';

export class MilestoneMother {
  private data: Milestone;

  private constructor(data: Milestone) {
    this.data = data;
  }

  public static basic(): MilestoneMother {
    return new MilestoneMother({
      id: 0,
      name: 'milestone-name',
      pillars: [],
      createdAt: new Date('2023-01-01T00:00:00Z'),
    });
  }

  public withId(id: number): MilestoneMother {
    this.data.id = id;
    return this;
  }

  public withName(name: string): MilestoneMother {
    this.data.name = name;
    return this;
  }

  public withPillars(pillars: Pillar[]): MilestoneMother {
    this.data.pillars = pillars;
    return this;
  }

  public withCreatedAt(createdAt: Date): MilestoneMother {
    this.data.createdAt = createdAt;
    return this;
  }

  public build(): Milestone {
    return this.data;
  }
}
