import type { SeverityType } from '../Finding';

export interface BestPractice {
  description: string;
  id: string;
  label: string;
  primaryId: string;
  results: Set<string>;
  risk: SeverityType;
  checked: boolean;
}

export interface BestPracticeBody {
  checked?: boolean;
}
