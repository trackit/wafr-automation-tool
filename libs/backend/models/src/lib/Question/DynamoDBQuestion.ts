import type { DynamoDBBestPractice } from '../BestPractice';

export interface DynamoDBQuestion {
  best_practices: Record<string, DynamoDBBestPractice>;
  disabled: boolean;
  id: string;
  label: string;
  none: boolean;
  primary_id: string;
}
