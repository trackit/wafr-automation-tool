import { DynamoDBBestPractice } from './DynamoDBBestPractice';

export interface DynamoDBQuestion {
  bestPractices: Record<string, DynamoDBBestPractice>;
  disabled: boolean;
  id: string;
  label: string;
  none: boolean;
  primaryId: string;
}
