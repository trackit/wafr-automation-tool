import { Pillar, RawPillar } from '../Pillar';

export interface QuestionSet {
  data: Pillar[];
  version: string;
}

export type RawQuestionSet = Record<string, RawPillar>;
