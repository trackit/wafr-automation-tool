import { Pillar } from '../Pillar';

export interface Milestone {
  id: number;
  name: string;
  createdAt: Date;
  pillars: Pillar[];
}

export interface MilestoneSummary {
  id: number;
  name: string;
  createdAt: Date;
}
