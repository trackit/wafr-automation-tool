import { SeverityType } from '@backend/models';

export interface DynamoDBBestPractice {
  description: string;
  id: string;
  label: string;
  primaryId: string;
  results: Set<string>;
  risk: SeverityType;
  checked: boolean;
}
