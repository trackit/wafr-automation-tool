import type { Question, RawQuestion } from '../Question';

export interface Pillar {
  disabled: boolean;
  id: string;
  label: string;
  primaryId: string;
  questions: Record<string, Question>;
}

export interface PillarBody {
  disabled?: boolean;
}

export interface RawPillar {
  primary_id: string;
  label: string;
  questions: Record<string, RawQuestion>;
}
