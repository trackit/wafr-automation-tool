import type { Finding, SeverityType } from '../Finding';

export interface BestPractice {
  description: string;
  id: string;
  label: string;
  primaryId: string;
  findings: Finding[];
  risk: SeverityType;
  checked: boolean;
}

export interface BestPracticeBody {
  checked?: boolean;
}
