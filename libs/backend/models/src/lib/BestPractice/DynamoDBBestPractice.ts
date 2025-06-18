import type { SeverityType } from '../Finding';

export interface DynamoDBBestPractice {
  description: string;
  id: string;
  label: string;
  primary_id: string;
  results: string[];
  risk: SeverityType;
  checked: boolean;
}
