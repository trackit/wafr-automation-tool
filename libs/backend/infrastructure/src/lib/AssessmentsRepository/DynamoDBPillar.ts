import { DynamoDBQuestion } from './DynamoDBQuestion';

export interface DynamoDBPillar {
  disabled: boolean;
  id: string;
  label: string;
  primaryId: string;
  questions: Record<string, DynamoDBQuestion>;
}
