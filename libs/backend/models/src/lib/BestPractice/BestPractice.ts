import type { SeverityType } from '../Finding';

export interface BestPractice {
  description: string;
  id: string;
  label: string;
  primaryId: string;
  results: string[];
  risk: SeverityType;
  checked: boolean;
}

export interface BestPracticeBody {
  checked?: boolean;
}

export interface RawBestPractice {
  primary_id: string;
  label: string;
  description: string;
  risk: SeverityType;
}
