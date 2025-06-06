import type { DynamoDBQuestion } from '../Question';

export interface DynamoDBPillar {
  disabled: boolean;
  id: string;
  label: string;
  primary_id: string;
  questions: Record<string, DynamoDBQuestion>;
}
