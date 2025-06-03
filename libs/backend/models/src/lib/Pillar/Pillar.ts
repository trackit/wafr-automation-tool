import type { Question } from '../Question';

export interface Pillar {
  disabled: boolean;
  id: string;
  label: string;
  primaryId: string;
  questions: Question[];
}
