import { Pillar, RawPillar } from '../Pillar';

export interface QuestionSet {
  data: Record<string, Pillar>;
  version: string;
}

export type RawQuestionSet = Record<string, RawPillar>;
