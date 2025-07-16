import type { DynamoDBQuestion } from '../Question';

export interface DynamoDBPillar {
  disabled: boolean;
  id: string;
  label: string;
  primaryId: string;
  questions: Record<string, DynamoDBQuestion>;
}
