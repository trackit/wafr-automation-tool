import type { BestPractice, RawBestPractice } from '../BestPractice';

export interface Question {
  bestPractices: Record<string, BestPractice>;
  disabled: boolean;
  id: string;
  label: string;
  none: boolean;
  primaryId: string;
}

export interface QuestionBody {
  disabled?: boolean;
  none?: boolean;
}

export interface RawQuestion {
  primary_id: string;
  label: string;
  best_practices: Record<string, RawBestPractice>;
}
