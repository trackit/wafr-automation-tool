import type { BestPractice } from '../BestPractice';

export interface Question {
  bestPractices: BestPractice[];
  disabled: boolean;
  id: string;
  label: string;
  none: boolean;
  primaryId: string;
}
