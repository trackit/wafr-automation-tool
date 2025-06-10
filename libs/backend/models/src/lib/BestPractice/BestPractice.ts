import type { SeverityType } from '../Finding';

export interface BestPractice {
  description: string;
  hiddenResults: string[];
  id: string;
  label: string;
  primaryId: string;
  results: string[];
  risk: SeverityType;
  status: boolean;
}

export interface BestPracticeBody {
  status?: boolean;
}
