import { z } from 'zod';

export const AIFindingAssociationSchema = z.object({
  id: z.number(),
  start: z.number(),
  end: z.number(),
});

export const AIFindingAssociationListSchema =
  AIFindingAssociationSchema.array();

export type AIFindingAssociation = z.infer<typeof AIFindingAssociationSchema>;

export interface AIBestPracticeMetadata {
  id: number;
  pillarLabel: string;
  questionLabel: string;
  bestPracticeLabel: string;
  bestPracticeDescription: string;
}

export interface AIBestPracticeAssociation {
  id: number;
  pillarId: string;
  questionId: string;
  bestPracticeId: string;
  bestPracticeFindingNumberIds: number[];
}

export interface AIFinding {
  id: string;
  statusDetail: string;
  riskDetails: string;
}
